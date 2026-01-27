const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { verifyAdminToken, ADMIN_USERS } = require('../middleware/admin');
const dataStore = require('../utils/dataStore');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Import users storage from auth route
const authModule = require('./auth');
let users;
try {
  users = authModule.users || new Map();
} catch (e) {
  users = new Map();
}

// Admin login endpoint
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if admin exists
    const admin = ADMIN_USERS.get(email);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password with bcrypt
    const isValid = await bcrypt.compare(password, admin.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token with role
    const token = jwt.sign(
      { 
        userId: admin.id,
        email: admin.email,
        role: admin.role
      },
      process.env.JWT_SECRET || 'default_secret_change_in_production',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Admin login successful',
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get dashboard overview
router.get('/dashboard', verifyAdminToken, (req, res) => {
  try {
    const stats = dataStore.getOverallStats();
    const userCount = users ? users.size : 0;
    
    res.json({
      overview: {
        totalUsers: userCount,
        totalVisits: stats.totalVisits,
        totalDownloads: stats.totalDownloads,
        totalContactSubmissions: stats.totalContactSubmissions,
        totalSubscriptionEvents: stats.totalSubscriptionEvents
      },
      recentVisits: stats.recentVisits,
      recentDownloads: stats.recentDownloads
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get all users
router.get('/users', verifyAdminToken, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    let userList = users ? Array.from(users.values()) : [];
    
    // Search filter
    if (search) {
      userList = userList.filter(u => 
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Remove passwords from response
    userList = userList.map(({ password, ...user }) => user);

    // Pagination
    const total = userList.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = userList.slice(startIndex, endIndex);

    res.json({
      users: paginatedUsers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get specific user details
router.get('/users/:userId', verifyAdminToken, (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Find user by ID
    const user = users ? Array.from(users.values()).find(u => u.id === userId) : null;
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's downloads
    const userDownloads = dataStore.getDownloads({ userId });
    
    // Get user's subscription events
    const subscriptionEvents = dataStore.getSubscriptionEvents({ userId });

    const { password, ...userWithoutPassword } = user;
    
    res.json({
      user: userWithoutPassword,
      downloads: userDownloads,
      subscriptionEvents
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Update user subscription status
router.patch('/users/:userId/subscription', verifyAdminToken, [
  body('subscription').isIn(['free', 'pro', 'enterprise', 'lifetime'])
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.params.userId;
    const { subscription } = req.body;

    // Find user by ID
    if (!users) {
      return res.status(500).json({ error: 'User storage not available' });
    }

    const userEmail = Array.from(users.entries()).find(([_, u]) => u.id === userId)?.[0];
    if (!userEmail) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users.get(userEmail);
    const previousStatus = user.subscription; // Store before updating
    user.subscription = subscription;
    users.set(userEmail, user);

    // Track subscription change
    dataStore.trackSubscriptionEvent({
      userId,
      type: 'admin_update',
      previousStatus,
      newStatus: subscription,
      updatedBy: req.adminEmail
    });

    const { password, ...userWithoutPassword } = user;
    res.json({
      message: 'Subscription updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Get all subscriptions from Stripe
router.get('/subscriptions', verifyAdminToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status; // active, past_due, canceled, etc.

    const params = { limit };
    if (status) {
      params.status = status;
    }

    const subscriptions = await stripe.subscriptions.list(params);
    
    res.json({
      subscriptions: subscriptions.data,
      hasMore: subscriptions.has_more
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions from Stripe' });
  }
});

// Get specific subscription details
router.get('/subscriptions/:subscriptionId', verifyAdminToken, async (req, res) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(req.params.subscriptionId);
    
    res.json({ subscription });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription details' });
  }
});

// Cancel a subscription (admin override)
router.post('/subscriptions/:subscriptionId/cancel', verifyAdminToken, async (req, res) => {
  try {
    const { immediate = false } = req.body;
    const subscriptionId = req.params.subscriptionId;

    let canceledSubscription;
    if (immediate) {
      // Cancel immediately
      canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);
    } else {
      // Cancel at period end
      canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });
    }

    // Track admin action
    dataStore.trackSubscriptionEvent({
      subscriptionId,
      type: 'admin_cancel',
      immediate,
      canceledBy: req.adminEmail,
      canceledAt: new Date().toISOString()
    });

    res.json({
      message: immediate ? 'Subscription canceled immediately' : 'Subscription will cancel at period end',
      subscription: canceledSubscription
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Resume a canceled subscription
router.post('/subscriptions/:subscriptionId/resume', verifyAdminToken, async (req, res) => {
  try {
    const subscriptionId = req.params.subscriptionId;

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    });

    // Track admin action
    dataStore.trackSubscriptionEvent({
      subscriptionId,
      type: 'admin_resume',
      resumedBy: req.adminEmail,
      resumedAt: new Date().toISOString()
    });

    res.json({
      message: 'Subscription resumed successfully',
      subscription
    });
  } catch (error) {
    console.error('Resume subscription error:', error);
    res.status(500).json({ error: 'Failed to resume subscription' });
  }
});

// Issue refund
router.post('/subscriptions/:subscriptionId/refund', verifyAdminToken, [
  body('amount').optional().isInt({ min: 1 }),
  body('reason').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const subscriptionId = req.params.subscriptionId;
    const { amount, reason } = req.body;

    // Get subscription to find latest invoice
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    if (!subscription.latest_invoice) {
      return res.status(400).json({ error: 'No invoice found for this subscription' });
    }

    // Get the payment intent from the invoice
    const invoice = await stripe.invoices.retrieve(subscription.latest_invoice);
    
    if (!invoice.payment_intent) {
      return res.status(400).json({ error: 'No payment intent found' });
    }

    // Create refund
    const refundParams = {
      payment_intent: invoice.payment_intent
    };
    
    if (amount) {
      refundParams.amount = amount;
    }
    
    if (reason) {
      refundParams.reason = reason;
    }

    const refund = await stripe.refunds.create(refundParams);

    // Track admin action
    dataStore.trackSubscriptionEvent({
      subscriptionId,
      type: 'admin_refund',
      refundId: refund.id,
      amount: refund.amount,
      reason,
      refundedBy: req.adminEmail,
      refundedAt: new Date().toISOString()
    });

    res.json({
      message: 'Refund issued successfully',
      refund
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ error: error.message || 'Failed to issue refund' });
  }
});

// Get website analytics
router.get('/analytics/visits', verifyAdminToken, (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const stats = dataStore.getVisitStats(days);
    const allVisits = dataStore.getVisits({});
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedVisits = allVisits.slice(startIndex, endIndex);

    res.json({
      stats,
      visits: paginatedVisits,
      pagination: {
        total: allVisits.length,
        page,
        limit,
        pages: Math.ceil(allVisits.length / limit)
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get download statistics
router.get('/analytics/downloads', verifyAdminToken, (req, res) => {
  try {
    const stats = dataStore.getDownloadStats();
    const downloads = dataStore.getDownloads({});

    res.json({
      stats,
      downloads: downloads.slice(0, 100) // Limit to most recent 100
    });
  } catch (error) {
    console.error('Download analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch download statistics' });
  }
});

// Get contact form submissions
router.get('/contact-submissions', verifyAdminToken, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;

    const submissions = dataStore.getContactSubmissions({ status });
    
    // Pagination
    const total = submissions.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSubmissions = submissions.slice(startIndex, endIndex);

    res.json({
      submissions: paginatedSubmissions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Contact submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch contact submissions' });
  }
});

// Get subscription events log
router.get('/subscription-events', verifyAdminToken, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const userId = req.query.userId;
    const type = req.query.type;

    const events = dataStore.getSubscriptionEvents({ userId, type });
    
    // Pagination
    const total = events.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEvents = events.slice(startIndex, endIndex);

    res.json({
      events: paginatedEvents,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Subscription events error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription events' });
  }
});

// Create manual subscription for a user
router.post('/users/:userId/create-subscription', verifyAdminToken, [
  body('plan').isIn(['pro', 'enterprise', 'lifetime']).withMessage('Invalid plan'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.params.userId;
    const { plan, duration = 30 } = req.body; // duration in days

    // Find user
    if (!users) {
      return res.status(500).json({ error: 'User storage not available' });
    }

    const userEmail = Array.from(users.entries()).find(([_, u]) => u.id === userId)?.[0];
    if (!userEmail) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users.get(userEmail);
    
    // Update user subscription
    user.subscription = plan;
    user.subscriptionEndDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString();
    users.set(userEmail, user);

    // Track manual subscription creation
    dataStore.trackSubscriptionEvent({
      userId,
      type: 'admin_manual_create',
      plan,
      duration,
      createdBy: req.adminEmail,
      endDate: user.subscriptionEndDate
    });

    const { password, ...userWithoutPassword } = user;
    res.json({
      message: 'Manual subscription created successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

module.exports = router;
