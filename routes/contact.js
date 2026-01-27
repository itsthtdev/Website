const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const dataStore = require('../utils/dataStore');

// Helper function to escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Validation middleware for contact form
const validateContactForm = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
];

// Rate limiter specifically for contact form submissions
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 contact submissions per 15 minutes
  message: 'Too many contact form submissions from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Contact form submission
router.post('/submit', contactLimiter, validateContactForm, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, subject, message, type = 'general' } = req.body;

    // Track contact submission for admin analytics
    dataStore.trackContactSubmission({
      name,
      email,
      subject,
      message,
      type,
      status: 'new'
    });

    // Log the submission
    console.log('Contact form submission:', {
      name,
      email,
      subject,
      type,
      timestamp: new Date().toISOString()
    });

    // Send email notification
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      try {
        const transporter = createTransporter();

        // Email to support team
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: process.env.EMAIL_USER,
          subject: `[EzClippin Contact] ${escapeHtml(subject)}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Type:</strong> ${escapeHtml(type)}</p>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
            <p><strong>Message:</strong></p>
            <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
            <hr>
            <p><small>Submitted at: ${new Date().toISOString()}</small></p>
          `,
        });

        // Confirmation email to user
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: email,
          subject: 'Thank you for contacting EzClippin',
          html: `
            <h2>Thank you for reaching out!</h2>
            <p>Hi ${escapeHtml(name)},</p>
            <p>We've received your message and will get back to you as soon as possible.</p>
            <p><strong>Your message:</strong></p>
            <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
            <hr>
            <p>Best regards,<br>The EzClippin Team</p>
          `,
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({
      message: 'Your message has been sent successfully. We will get back to you soon!',
      success: true
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

// Submit complaint/support ticket
router.post('/complaint', contactLimiter, validateContactForm, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, subject, message, priority = 'medium' } = req.body;

    // Track complaint submission for admin analytics
    dataStore.trackContactSubmission({
      name,
      email,
      subject,
      message,
      type: 'complaint',
      priority,
      status: 'new'
    });

    // Log the complaint
    console.log('Complaint submission:', {
      name,
      email,
      subject,
      priority,
      timestamp: new Date().toISOString()
    });

    // Send email notification
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      try {
        const transporter = createTransporter();

        await transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: process.env.EMAIL_USER,
          subject: `[EzClippin COMPLAINT - ${escapeHtml(priority).toUpperCase()}] ${escapeHtml(subject)}`,
          html: `
            <h2>New Complaint Received</h2>
            <p><strong>Priority:</strong> <span style="color: ${priority === 'high' ? 'red' : 'orange'};">${escapeHtml(priority).toUpperCase()}</span></p>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
            <p><strong>Complaint:</strong></p>
            <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
            <hr>
            <p><small>Submitted at: ${new Date().toISOString()}</small></p>
          `,
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
      }
    }

    res.json({
      message: 'Your complaint has been submitted. We take all feedback seriously and will address this promptly.',
      ticketId: `TICKET-${Date.now()}`,
      success: true
    });
  } catch (error) {
    console.error('Complaint submission error:', error);
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
});

// Get contact information
router.get('/info', (req, res) => {
  res.json({
    email: 'support@ezclippin.studio',
    supportHours: 'Monday - Friday, 9AM - 6PM EST',
    responseTime: 'Within 24 hours',
    emergencyContact: 'For urgent issues, please email: urgent@ezclippin.studio'
  });
});

module.exports = router;
