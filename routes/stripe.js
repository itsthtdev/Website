const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const { verifyToken } = require('./auth');

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

    if (!amount || amount < 50) { // Minimum $0.50
      return res.status(400).json({ error: 'Invalid amount' });
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

    // Cancel subscription at period end
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    res.json({
      message: 'Subscription will be canceled at period end',
      cancelAt: subscription.cancel_at
    });
  } catch (error) {
    console.error('Subscription cancel error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Checkout completed:', session);
        // Update user subscription in database
        break;

      case 'customer.subscription.created':
        console.log('Subscription created:', event.data.object);
        // Update user subscription status
        break;

      case 'customer.subscription.updated':
        console.log('Subscription updated:', event.data.object);
        // Update user subscription status
        break;

      case 'customer.subscription.deleted':
        console.log('Subscription deleted:', event.data.object);
        // Downgrade user to free plan
        break;

      case 'invoice.payment_succeeded':
        console.log('Payment succeeded:', event.data.object);
        // Send receipt email
        break;

      case 'invoice.payment_failed':
        console.log('Payment failed:', event.data.object);
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
