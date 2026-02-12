const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const { verifyToken } = require('./auth');
const dataStore = require('../utils/dataStore');

// Validate Stripe configuration
const isStripeConfigured = () => {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder' &&
    !process.env.STRIPE_SECRET_KEY.includes('your_')
  );
};

if (!isStripeConfigured()) {
  console.warn('⚠️  Stripe not configured - payment features will not work');
}

const stripe = isStripeConfigured() 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Stripe Price IDs - configure these in your .env or manage via Stripe dashboard
// For security, validate priceIds from environment or database, not hardcoded
const getAllowedPriceIds = () => {
  // Get allowed price IDs from environment variable (comma-separated)
  // Example: STRIPE_ALLOWED_PRICE_IDS=price_xxx,price_yyy,price_zzz
  const envPriceIds = process.env.STRIPE_ALLOWED_PRICE_IDS;
  if (envPriceIds) {
    return envPriceIds.split(',').map(id => id.trim()).filter(id => id);
  }
  // If not configured, allow any price ID (less secure but functional)
  return null; // null means "don't validate" - any priceId accepted
};

// Get Stripe publishable key
router.get('/config', (req, res) => {
  if (!isStripeConfigured()) {
    return res.status(503).json({ 
      error: 'Stripe is not configured. Payment features are unavailable.' 
    });
  }
  
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || ''
  });
});

// Create checkout session for subscription
router.post('/create-checkout-session', verifyToken, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payment service is not configured' });
  }
  
  try {
    const { priceId, plan } = req.body;

    if (!priceId || typeof priceId !== 'string') {
      return res.status(400).json({ error: 'Valid price ID is required' });
    }

    // Validate priceId format (Stripe price IDs start with 'price_')
    if (!priceId.startsWith('price_')) {
      return res.status(400).json({ error: 'Invalid price ID format' });
    }

    // Validate against allowed price IDs if configured
    const allowedPriceIds = getAllowedPriceIds();
    if (allowedPriceIds && allowedPriceIds.length > 0) {
      if (!allowedPriceIds.includes(priceId)) {
        return res.status(400).json({ error: 'Invalid or unauthorized price ID' });
      }
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/#pricing`,
      client_reference_id: req.userId,
      metadata: {
        userId: req.userId,
        plan: plan || 'pro'
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create payment intent for one-time payment
router.post('/create-payment-intent', verifyToken, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payment service is not configured' });
  }
  
  try {
    const { amount, currency = 'usd', description } = req.body;

    // Validate amount (minimum $0.50, maximum $999,999.99)
    if (!amount || typeof amount !== 'number' || amount < 50) {
      return res.status(400).json({ error: 'Amount must be at least $0.50' });
    }
    
    if (amount > 99999999) { // $999,999.99 max
      return res.status(400).json({ error: 'Amount exceeds maximum allowed value' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description,
      metadata: {
        userId: req.userId
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Payment intent error:', error.message);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Get customer's subscription status
router.get('/subscription/status', verifyToken, async (req, res) => {
  try {
    // In production, fetch customer ID from database using req.userId
    // For now, return mock data
    res.json({
      hasSubscription: false,
      plan: 'free',
      status: 'inactive',
      currentPeriodEnd: null
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

// Cancel subscription
router.post('/subscription/cancel', verifyToken, async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    // Retrieve subscription to verify ownership before cancelling
    let subscription;
    try {
      subscription = await stripe.subscriptions.retrieve(subscriptionId);
    } catch (err) {
      console.error('Subscription retrieve error:', err);
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const subscriptionUserId =
      subscription && subscription.metadata && subscription.metadata.userId;

    // Ensure the subscription belongs to the authenticated user
    if (!subscriptionUserId || String(subscriptionUserId) !== String(req.userId)) {
      return res.status(403).json({ error: 'You are not authorized to cancel this subscription' });
    }

    // Cancel subscription at period end
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    res.json({
      message: 'Subscription will be canceled at period end',
      cancelAt: updatedSubscription.cancel_at
    });
  } catch (error) {
    console.error('Subscription cancel error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Stripe webhook handler
// Note: Raw body parsing is handled at server.js level before this route
router.post('/webhook', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payment service is not configured' });
  }
  
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Require webhook secret for security
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured - webhook verification disabled');
    return res.status(500).json({ error: 'Webhook verification is not configured' });
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Checkout completed:', session.id);
        dataStore.trackSubscriptionEvent({
          type: 'checkout_completed',
          userId: session.client_reference_id,
          sessionId: session.id,
          data: session
        });
        // Update user subscription in database
        break;

      case 'customer.subscription.created':
        console.log('Subscription created:', event.data.object.id);
        dataStore.trackSubscriptionEvent({
          type: 'subscription_created',
          subscriptionId: event.data.object.id,
          userId: event.data.object.metadata?.userId,
          data: event.data.object
        });
        // Update user subscription status
        break;

      case 'customer.subscription.updated':
        console.log('Subscription updated:', event.data.object.id);
        dataStore.trackSubscriptionEvent({
          type: 'subscription_updated',
          subscriptionId: event.data.object.id,
          userId: event.data.object.metadata?.userId,
          data: event.data.object
        });
        // Update user subscription status
        break;

      case 'customer.subscription.deleted':
        console.log('Subscription deleted:', event.data.object.id);
        dataStore.trackSubscriptionEvent({
          type: 'subscription_deleted',
          subscriptionId: event.data.object.id,
          userId: event.data.object.metadata?.userId,
          data: event.data.object
        });
        // Downgrade user to free plan
        break;

      case 'invoice.payment_succeeded':
        console.log('Payment succeeded:', event.data.object.id);
        dataStore.trackSubscriptionEvent({
          type: 'payment_succeeded',
          invoiceId: event.data.object.id,
          subscriptionId: event.data.object.subscription,
          data: event.data.object
        });
        // Send receipt email
        break;

      case 'invoice.payment_failed':
        console.log('Payment failed:', event.data.object.id);
        dataStore.trackSubscriptionEvent({
          type: 'payment_failed',
          invoiceId: event.data.object.id,
          subscriptionId: event.data.object.subscription,
          data: event.data.object
        });
        // Notify user of payment failure
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(400).json({ error: 'Webhook signature verification failed' });
  }
});

module.exports = router;
