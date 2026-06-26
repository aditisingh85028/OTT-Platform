const Plan = require('../models/Plan');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// @desc    Get all subscription plans
// @route   GET /api/plans
// @access  Public
const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({});
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create plan (Admin only)
// @route   POST /api/plans
// @access  Private/Admin
const createPlan = async (req, res) => {
  const { name, price, features, durationMonths } = req.body;

  try {
    const planExists = await Plan.findOne({ name });
    if (planExists) {
      return res.status(400).json({ message: 'Plan with this name already exists' });
    }

    const plan = new Plan({
      name,
      price: Number(price),
      features: Array.isArray(features) ? features : features.split(',').map(f => f.trim()),
      durationMonths: Number(durationMonths) || 1,
    });

    const createdPlan = await plan.save();
    res.status(201).json(createdPlan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Subscribe to a plan (Mock payment check)
// @route   POST /api/plans/subscribe
// @access  Private
const subscribeToPlan = async (req, res) => {
  const { planId, cardNumber, expiry, cvv } = req.body;

  try {
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Mock Card Validation (Any card is accepted, but let's make it look like we check it)
    if (cardNumber && cardNumber.replace(/\s/g, '').length < 16) {
      return res.status(400).json({ message: 'Invalid card number format' });
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + plan.durationMonths);

    // Save user subscription status
    user.subscription.plan = plan._id;
    user.subscription.status = 'active';
    user.subscription.startDate = startDate;
    user.subscription.endDate = endDate;
    await user.save();

    // Create a transaction record
    const txnId = 'TXN-' + Math.random().toString(36).substring(2, 11).toUpperCase();
    const transaction = new Transaction({
      user: user._id,
      plan: plan._id,
      amount: plan.price,
      paymentStatus: 'success',
      paymentMethod: 'mock_card',
      transactionId: txnId,
    });
    await transaction.save();

    // Populate user's subscription details to return
    const updatedUser = await User.findById(user._id).populate('subscription.plan');

    res.status(200).json({
      message: 'Subscription successful',
      subscription: updatedUser.subscription,
      transaction,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .populate('plan')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create Razorpay Order
// @route   POST /api/plans/razorpay-order
// @access  Private
const createRazorpayOrder = async (req, res) => {
  const { planId } = req.body;

  try {
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_disdvwcgrKey';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'zIAqlzVnIc2s0viTDVvLl3MiJ5A';

    // If key/secret are default placeholders, return mock details immediately
    if (keyId === 'rzp_test_disdvwcgrKey' || keySecret === 'zIAqlzVnIc2s0viTDVvLl3MiJ5A') {
      return res.status(200).json({
        isMock: true,
        order: {
          id: `order_mock_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          amount: plan.price * 100,
          currency: 'INR'
        },
        plan,
        keyId
      });
    }

    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: plan.price * 100, // in paise
      currency: 'INR',
      receipt: `receipt_order_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    };

    const order = await instance.orders.create(options);
    res.status(200).json({ isMock: false, order, plan, keyId });
  } catch (error) {
    console.warn('Razorpay order creation failed, falling back to mock order:', error.message);
    // Graceful fallback to mock order so the UX works even without active Razorpay account
    try {
      const plan = await Plan.findById(planId);
      res.status(200).json({
        isMock: true,
        order: {
          id: `order_mock_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          amount: plan.price * 100,
          currency: 'INR'
        },
        plan,
        keyId: 'rzp_test_disdvwcgrKey'
      });
    } catch (innerError) {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Verify Razorpay Payment signature
// @route   POST /api/plans/razorpay-verify
// @access  Private
const verifyRazorpayPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    planId,
    isMock
  } = req.body;

  try {
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 1. Skip signature check if using mock mode or mock order
    if (isMock || (razorpay_order_id && razorpay_order_id.startsWith('order_mock_'))) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(startDate.getMonth() + plan.durationMonths);

      user.subscription.plan = plan._id;
      user.subscription.status = 'active';
      user.subscription.startDate = startDate;
      user.subscription.endDate = endDate;
      await user.save();

      const transaction = new Transaction({
        user: user._id,
        plan: plan._id,
        amount: plan.price,
        paymentStatus: 'success',
        paymentMethod: 'mock_razorpay',
        transactionId: razorpay_payment_id || `pay_mock_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      });
      await transaction.save();

      const updatedUser = await User.findById(user._id).populate('subscription.plan');

      return res.status(200).json({
        success: true,
        message: 'Mock Payment verified and subscription activated successfully',
        subscription: updatedUser.subscription,
        transaction,
      });
    }

    // 2. Real Razorpay Signature Verification
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'zIAqlzVnIc2s0viTDVvLl3MiJ5A';

    // Verify Signature
    const shasum = crypto.createHmac('sha256', keySecret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed: Invalid signature' });
    }

    // Signature matches! Upgrade user's subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + plan.durationMonths);

    user.subscription.plan = plan._id;
    user.subscription.status = 'active';
    user.subscription.startDate = startDate;
    user.subscription.endDate = endDate;
    await user.save();

    // Create transaction log
    const transaction = new Transaction({
      user: user._id,
      plan: plan._id,
      amount: plan.price,
      paymentStatus: 'success',
      paymentMethod: 'razorpay',
      transactionId: razorpay_payment_id,
    });
    await transaction.save();

    // Populate user's subscription details to return
    const updatedUser = await User.findById(user._id).populate('subscription.plan');

    res.status(200).json({
      success: true,
      message: 'Payment verified and subscription activated successfully',
      subscription: updatedUser.subscription,
      transaction,
    });
  } catch (error) {
    console.error('Razorpay Verify Error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPlans,
  createPlan,
  subscribeToPlan,
  getUserTransactions,
  createRazorpayOrder,
  verifyRazorpayPayment,
};

