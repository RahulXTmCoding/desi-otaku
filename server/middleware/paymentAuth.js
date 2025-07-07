const Razorpay = require('razorpay');
const { Order } = require('../models/order');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.verifyPayment = async (req, res, next) => {
  const { transaction_id } = req.body.order || req.body;

  if (!transaction_id) {
    return res.status(400).json({
      error: 'Payment transaction ID is required.',
    });
  }

  try {
    const payment = await razorpay.payments.fetch(transaction_id);

    if (payment.status !== 'captured') {
      return res.status(400).json({
        error: 'Payment not captured. Please complete the payment.',
      });
    }

    // Attach payment details to the request for the next controller
    req.payment = payment;
    next();
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    return res.status(400).json({
      error: 'Invalid payment transaction ID.',
    });
  }
};
