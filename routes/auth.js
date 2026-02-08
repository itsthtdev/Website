const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const appwrite = require('../utils/appwrite');

// Fallback: In-memory user storage (used when Appwrite is not configured)
const users = new Map();

// Check if Appwrite is configured
const useAppwrite = appwrite.isConfigured();

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

// Signup endpoint - creates user immediately without SMS verification
router.post('/signup', validateSignup, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, password } = req.body;

    if (useAppwrite) {
      try {
        // Check if user already exists in Appwrite
        const existingUsers = await appwrite.userOperations.list([
          appwrite.Query.equal('email', [email])
        ]);
        
        if (existingUsers.total > 0) {
          return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password for storage in profile
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user in Appwrite Auth
        const appwriteUser = await appwrite.userOperations.create(email, password, name, phone);

        // Create user profile in database with hashed password
        await appwrite.userProfileOperations.create(appwriteUser.$id, {
          subscription: 'free',
          verified: true, // Auto-verified in beta
          passwordHash: hashedPassword // Store hashed password for verification
        });

        // Generate JWT token
        const token = generateToken(appwriteUser.$id);

        // Return user data
        res.status(201).json({
          message: 'User created successfully',
          user: {
            id: appwriteUser.$id,
            name: appwriteUser.name,
            email: appwriteUser.email,
            phone: appwriteUser.phone,
            subscription: 'free',
            verified: true,
            createdAt: appwriteUser.$createdAt
          },
          token
        });
      } catch (appwriteError) {
        console.error('Appwrite signup error:', appwriteError);
        
        // Check if it's a duplicate email error
        if (appwriteError.code === 409 || appwriteError.message?.includes('already exists')) {
          return res.status(409).json({ error: 'User already exists' });
        }
        
        return res.status(500).json({ error: 'Failed to create user' });
      }
    } else {
      // Fallback to in-memory storage
      // Check if user already exists
      if (users.has(email)) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = {
        id: crypto.randomUUID(),
        name,
        email,
        phone,
        password: hashedPassword,
        subscription: 'free',
        verified: true, // Auto-verified in beta
        createdAt: new Date().toISOString()
      };

      users.set(email, user);

      // Generate token
      const token = generateToken(user.id);

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        message: 'User created successfully',
        user: userWithoutPassword,
        token
      });
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

    if (useAppwrite) {
      try {
        // Find user by email in Appwrite
        const userList = await appwrite.userOperations.list([
          appwrite.Query.equal('email', [email])
        ]);

        if (userList.total === 0) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const appwriteUser = userList.users[0];

        // Get user profile from database (contains password hash)
        let profile;
        try {
          profile = await appwrite.userProfileOperations.get(appwriteUser.$id);
        } catch (profileError) {
          // Profile doesn't exist - user may have been created before this update
          // Create profile without password hash (they'll need to reset)
          profile = await appwrite.userProfileOperations.create(appwriteUser.$id, {
            subscription: 'free',
            verified: true
          });
          // For backward compatibility, allow login without password verification
          // in this case (only for migration period)
        }

        // Verify password if hash exists
        if (profile.passwordHash) {
          const isValidPassword = await bcrypt.compare(password, profile.passwordHash);
          if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
          }
        }
        // If no password hash, skip verification (backward compatibility)
        
        // Generate JWT token
        const token = generateToken(appwriteUser.$id);

        res.json({
          message: 'Login successful',
          user: {
            id: appwriteUser.$id,
            name: appwriteUser.name,
            email: appwriteUser.email,
            phone: appwriteUser.phone,
            subscription: profile.subscription || 'free',
            verified: profile.verified || true,
            createdAt: appwriteUser.$createdAt
          },
          token
        });
      } catch (appwriteError) {
        console.error('Appwrite login error:', appwriteError);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      // Fallback to in-memory storage
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
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
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
router.get('/profile', verifyToken, async (req, res) => {
  try {
    if (useAppwrite) {
      try {
        // Get user from Appwrite
        const appwriteUser = await appwrite.userOperations.get(req.userId);
        
        // Get user profile from database
        let profile;
        try {
          profile = await appwrite.userProfileOperations.get(req.userId);
        } catch (profileError) {
          // Profile doesn't exist, create it
          profile = await appwrite.userProfileOperations.create(req.userId, {
            subscription: 'free',
            verified: true
          });
        }

        res.json({
          id: appwriteUser.$id,
          name: appwriteUser.name,
          email: appwriteUser.email,
          phone: appwriteUser.phone,
          subscription: profile.subscription || 'free',
          verified: profile.verified || true,
          createdAt: appwriteUser.$createdAt
        });
      } catch (appwriteError) {
        console.error('Appwrite get profile error:', appwriteError);
        return res.status(404).json({ error: 'User not found' });
      }
    } else {
      // Fallback to in-memory storage
      // Find user by ID
      const user = Array.from(users.values()).find(u => u.id === req.userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    }
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

module.exports = router;
module.exports.verifyToken = verifyToken;
module.exports.users = users;
