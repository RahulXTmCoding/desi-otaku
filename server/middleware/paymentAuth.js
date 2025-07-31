const Razorpay = require('razorpay');
const { Order } = require('../models/order');
const PaymentAudit = require('../models/paymentAudit');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.verifyPayment = async (req, res, next) => {
  const { transaction_id } = req.body.order || req.body;
  let auditLog = null;

  if (!transaction_id) {
    return res.status(400).json({
      error: 'Payment transaction ID is required.',
    });
  }

  try {
    // 🔒 SECURITY: Create comprehensive audit log
    auditLog = new PaymentAudit({
      transactionId: transaction_id,
      razorpayPaymentId: transaction_id,
      userId: req.profile?._id || null,
      guestInfo: req.body.guestInfo || null,
      clientAmount: req.body.order?.amount || req.body.amount || 0,
      serverCalculatedAmount: 0, // Will be calculated
      paidAmount: 0, // Will be fetched from Razorpay
      clientIP: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || '',
      paymentInitiatedAt: new Date()
    });

    // Add initial event
    await auditLog.addEvent('payment_verification_started', {
      transactionId: transaction_id,
      userType: req.profile ? 'authenticated' : 'guest'
    });

    const payment = await razorpay.payments.fetch(transaction_id);

    // Update audit log with payment details
    auditLog.paidAmount = payment.amount / 100; // Convert from paise to rupees
    auditLog.paymentStatus = payment.status;
    auditLog.paymentMethod = payment.method || 'unknown';
    auditLog.bank = payment.bank || null;
    auditLog.wallet = payment.wallet || null;
    auditLog.upiId = payment.vpa || null;
    auditLog.cardNetwork = payment.card?.network || null;
    auditLog.paymentCompletedAt = payment.created_at ? new Date(payment.created_at * 1000) : new Date();

    // 🔒 SECURITY: Enhanced fraud detection
    const ipRisk = await PaymentAudit.checkIPRisk(auditLog.clientIP);
    const emailRisk = auditLog.guestInfo?.email 
      ? await PaymentAudit.checkEmailRisk(auditLog.guestInfo.email)
      : { riskLevel: 'low', recentOrders: 0 };

    // Calculate risk score
    let riskScore = 0;
    if (ipRisk.riskLevel === 'high') riskScore += 40;
    else if (ipRisk.riskLevel === 'medium') riskScore += 20;
    
    if (emailRisk.riskLevel === 'high') riskScore += 30;
    else if (emailRisk.riskLevel === 'medium') riskScore += 15;

    auditLog.riskScore = riskScore;

    // Flag for review if high risk
    if (riskScore >= 50) {
      await auditLog.flagForReview(`High risk transaction: IP risk ${ipRisk.riskLevel}, Email risk ${emailRisk.riskLevel}`);
      console.warn('🚨 HIGH RISK PAYMENT FLAGGED:', {
        transactionId: transaction_id,
        riskScore,
        ipRisk: ipRisk.riskLevel,
        emailRisk: emailRisk.riskLevel,
        clientIP: auditLog.clientIP
      });
    }

    if (payment.status !== 'captured') {
      await auditLog.addEvent('payment_verification_failed', {
        reason: 'Payment not captured',
        paymentStatus: payment.status
      });
      
      await auditLog.save();
      
      return res.status(400).json({
        error: 'Payment not captured. Please complete the payment.',
      });
    }

    // Verify payment signature if available
    const { razorpay_order_id, razorpay_signature } = req.body;
    if (razorpay_order_id && razorpay_signature) {
      const crypto = require('crypto');
      const body = razorpay_order_id + '|' + transaction_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');
      
      auditLog.signatureVerified = expectedSignature === razorpay_signature;
      auditLog.razorpayOrderId = razorpay_order_id;
      
      if (!auditLog.signatureVerified) {
        await auditLog.flagForReview('Invalid payment signature');
        console.error('❌ INVALID PAYMENT SIGNATURE:', {
          transactionId: transaction_id,
          orderId: razorpay_order_id
        });
      }
    }

    await auditLog.addEvent('payment_verification_successful', {
      paymentAmount: auditLog.paidAmount,
      paymentMethod: auditLog.paymentMethod,
      signatureVerified: auditLog.signatureVerified
    });

    auditLog.verificationAt = new Date();
    await auditLog.save();

    // Attach payment details and audit log to the request
    req.payment = payment;
    req.paymentAudit = auditLog;
    
    console.log('✅ Payment verified successfully:', {
      transactionId: transaction_id,
      amount: auditLog.paidAmount,
      method: auditLog.paymentMethod,
      riskScore: auditLog.riskScore
    });
    
    next();
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    
    if (auditLog) {
      await auditLog.addError(error, error.stack);
      await auditLog.addEvent('payment_verification_error', {
        error: error.message
      });
      await auditLog.save();
    }
    
    return res.status(400).json({
      error: 'Invalid payment transaction ID.',
    });
  }
};
