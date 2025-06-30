const Order = require('../models/order');

// Initialize Stripe only if secret key is available
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'inr', orderId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount'
      });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents/paise
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId: orderId || 'test-order'
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Stripe payment intent error:', error);
    res.status(500).json({
      error: 'Failed to create payment intent',
      message: error.message
    });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update order with payment information
      if (orderId) {
        const order = await Order.findById(orderId);
        if (order) {
          order.paymentStatus = 'paid';
          order.paymentMethod = 'stripe';
          order.paymentId = paymentIntentId;
          order.status = 'processing';
          await order.save();
        }
      }

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100 // Convert back from paise to rupees
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not successful',
        status: paymentIntent.status
      });
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      error: 'Failed to confirm payment',
      message: error.message
    });
  }
};

exports.webhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent was successful!', paymentIntent.id);
      
      // Update order status
      if (paymentIntent.metadata.orderId) {
        try {
          const order = await Order.findById(paymentIntent.metadata.orderId);
          if (order) {
            order.paymentStatus = 'paid';
            order.paymentId = paymentIntent.id;
            order.status = 'processing';
            await order.save();
          }
        } catch (error) {
          console.error('Error updating order:', error);
        }
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      
      // Update order status
      if (failedPayment.metadata.orderId) {
        try {
          const order = await Order.findById(failedPayment.metadata.orderId);
          if (order) {
            order.paymentStatus = 'failed';
            order.status = 'payment_failed';
            await order.save();
          }
        } catch (error) {
          console.error('Error updating order:', error);
        }
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
};

exports.getPaymentMethods = async (req, res) => {
  try {
    const methods = [
      {
        id: 'stripe',
        name: 'Credit/Debit Card',
        description: 'Pay securely with your credit or debit card',
        icon: 'credit-card',
        active: true
      },
      {
        id: 'paypal',
        name: 'PayPal',
        description: 'Pay with your PayPal account',
        icon: 'paypal',
        active: false
      },
      {
        id: 'cod',
        name: 'Cash on Delivery',
        description: 'Pay when you receive your order',
        icon: 'cash',
        active: false
      }
    ];

    res.json(methods);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch payment methods'
    });
  }
};
