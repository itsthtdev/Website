const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const { verifyToken } = require('./auth');
const dataStore = require('../utils/dataStore');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Get Stripe publishable key
router.get('/config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'
  });
});

// Create checkout session for subscription
router.post('/create-checkout-session', verifyToken, async (req, res) => {
  try {
    const { priceId, plan } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    const allowedPriceIds = Object.values(PRICE_IDS);
    if (!allowedPriceIds.includes(priceId)) {
      return res.status(400).json({ error: 'Invalid price ID' });
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
      success_url: `${process.env.CLIENT_URL || 'http://localhost:8080'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:8080'}/#pricing`,
      client_reference_id: req.userId,
      metadata: {
        userId: req.userId,
        plan: plan || 'pro'
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create payment intent for one-time payment
router.post('/create-payment-intent', verifyToken, async (req, res) => {
  try {
    const { amount, currency = 'usd', description } = req.body;

    // Validate amount (minimum $0.50, maximum $999,999.99)
    if (!amount || amount < 50) {
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
    console.error('Payment intent error:', error);
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
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Checkout completed:', session);
        // Store only essential fields instead of full data object
        dataStore.trackSubscriptionEvent({
          type: 'checkout_completed',
          userId: session.client_reference_id,
          sessionId: session.id,
          subscriptionId: session.subscription,
          amount: session.amount_total,
          currency: session.currency,
          status: session.payment_status
        });
        // Update user subscription in database
        break;

      case 'customer.subscription.created':
        const subCreated = event.data.object;
        console.log('Subscription created:', subCreated);
        // Store only essential fields instead of full data object
        dataStore.trackSubscriptionEvent({
          type: 'subscription_created',
          subscriptionId: subCreated.id,
          userId: subCreated.metadata?.userId,
          customerId: subCreated.customer,
          status: subCreated.status,
          currentPeriodStart: subCreated.current_period_start,
          currentPeriodEnd: subCreated.current_period_end
        });
        // Update user subscription status
        break;

      case 'customer.subscription.updated':
        const subUpdated = event.data.object;
        console.log('Subscription updated:', subUpdated);
        // Store only essential fields instead of full data object
        dataStore.trackSubscriptionEvent({
          type: 'subscription_updated',
          subscriptionId: subUpdated.id,
          userId: subUpdated.metadata?.userId,
          customerId: subUpdated.customer,
          status: subUpdated.status,
          cancelAtPeriodEnd: subUpdated.cancel_at_period_end,
          currentPeriodEnd: subUpdated.current_period_end
        });
        // Update user subscription status
        break;

      case 'customer.subscription.deleted':
        const subDeleted = event.data.object;
        console.log('Subscription deleted:', subDeleted);
        // Store only essential fields instead of full data object
        dataStore.trackSubscriptionEvent({
          type: 'subscription_deleted',
          subscriptionId: subDeleted.id,
          userId: subDeleted.metadata?.userId,
          customerId: subDeleted.customer,
          status: subDeleted.status,
          canceledAt: subDeleted.canceled_at
        });
        // Downgrade user to free plan
        break;

      case 'invoice.payment_succeeded':
        const invoiceSuccess = event.data.object;
        console.log('Payment succeeded:', invoiceSuccess);
        // Store only essential fields instead of full data object
        dataStore.trackSubscriptionEvent({
          type: 'payment_succeeded',
          invoiceId: invoiceSuccess.id,
          subscriptionId: invoiceSuccess.subscription,
          customerId: invoiceSuccess.customer,
          amount: invoiceSuccess.amount_paid,
          currency: invoiceSuccess.currency,
          status: invoiceSuccess.status
        });
        // Send receipt email
        break;

      case 'invoice.payment_failed':
        const invoiceFailed = event.data.object;
        console.log('Payment failed:', invoiceFailed);
        // Store only essential fields instead of full data object
        dataStore.trackSubscriptionEvent({
          type: 'payment_failed',
          invoiceId: invoiceFailed.id,
          subscriptionId: invoiceFailed.subscription,
          customerId: invoiceFailed.customer,
          amount: invoiceFailed.amount_due,
          currency: invoiceFailed.currency,
          attemptCount: invoiceFailed.attempt_count
        });
        // Notify user of payment failure
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook signature verification failed' });
  }
});

module.exports = router;
