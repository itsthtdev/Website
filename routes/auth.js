const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const smsService = require('../utils/smsService');

// In-memory user storage (in production, use a database)
const users = new Map();

// In-memory storage for pending signups (awaiting SMS verification)
const pendingSignups = new Map();

// Validation middleware
const validateSignup = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').matches(/[\+]?[0-9\s\-\(\)]{10,}/).withMessage('Valid phone number is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain a special character'),
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'default_secret_change_in_production',
    { expiresIn: '7d' }
  );
};

// Signup endpoint
router.post('/signup', validateSignup, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, password } = req.body;

    // Check if user already exists
    if (users.has(email)) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store signup data temporarily (pending SMS verification)
    pendingSignups.set(email, {
      name,
      email,
      phone,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    });

    // Send SMS verification code
    try {
      const result = await smsService.sendVerificationCode(phone, email);
      
      res.status(200).json({
        message: 'Verification code sent to your phone',
        email,
        phone: phone.replace(/(\d{3})\d{3}(\d{4})/, '$1***$2'), // Mask phone number
        ...(process.env.NODE_ENV === 'development' && result.devCode ? { devCode: result.devCode } : {})
      });
    } catch (error) {
      // Clean up pending signup if SMS fails
      pendingSignups.delete(email);
      console.error('SMS sending error:', error);
      res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Login endpoint
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = users.get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify SMS code endpoint
router.post('/verify-sms', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('code').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Valid 6-digit code is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code } = req.body;

    // Get pending signup
    const pendingSignup = pendingSignups.get(email);
    if (!pendingSignup) {
      return res.status(400).json({ error: 'No pending signup found. Please sign up first.' });
    }

    // Verify the code
    const verificationResult = smsService.verifyCode(email, code);
    
    if (!verificationResult.success) {
      return res.status(400).json({ error: verificationResult.error });
    }

    // Create the user account
    const user = {
      id: crypto.randomUUID(),
      name: pendingSignup.name,
      email: pendingSignup.email,
      phone: pendingSignup.phone,
      password: pendingSignup.password,
      subscription: 'free',
      verified: true,
      createdAt: new Date().toISOString()
    };

    users.set(email, user);
    pendingSignups.delete(email);

    // Generate token
    const token = generateToken(user.id);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'Account created successfully',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('SMS verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Resend SMS code endpoint
router.post('/resend-sms', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Get pending signup
    const pendingSignup = pendingSignups.get(email);
    if (!pendingSignup) {
      return res.status(400).json({ error: 'No pending signup found. Please sign up first.' });
    }

    // Send new verification code
    try {
      const result = await smsService.sendVerificationCode(pendingSignup.phone, email);
      
      res.status(200).json({
        message: 'Verification code resent',
        phone: pendingSignup.phone.replace(/(\d{3})\d{3}(\d{4})/, '$1***$2'),
        ...(process.env.NODE_ENV === 'development' && result.devCode ? { devCode: result.devCode } : {})
      });
    } catch (error) {
      console.error('SMS resend error:', error);
      res.status(500).json({ error: 'Failed to resend verification code. Please try again.' });
    }
  } catch (error) {
    console.error('Resend SMS error:', error);
    res.status(500).json({ error: 'Failed to resend code' });
  }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default_secret_change_in_production'
    );
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get user profile
router.get('/profile', verifyToken, (req, res) => {
  // Find user by ID
  const user = Array.from(users.values()).find(u => u.id === req.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

module.exports = router;
module.exports.verifyToken = verifyToken;
module.exports.users = users;
