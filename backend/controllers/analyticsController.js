const User = require('../models/User');
const Content = require('../models/Content');
const Transaction = require('../models/Transaction');
const Plan = require('../models/Plan');

// @desc    Get dashboard analytics overview
// @route   GET /api/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
  try {
    // 1. Total Counts
    const totalUsers = await User.countDocuments();
    const totalContent = await Content.countDocuments();
    
    // Total subscribers (where subscription status is active)
    const activeSubscribers = await User.countDocuments({
      'subscription.status': 'active',
    });

    // 2. Total Revenue from successful transactions
    const successfulTxns = await Transaction.find({ paymentStatus: 'success' });
    const totalRevenue = successfulTxns.reduce((acc, curr) => acc + curr.amount, 0);

    // 3. Subscription distribution
    const plans = await Plan.find({});
    const planDistribution = [];
    for (const plan of plans) {
      const count = await User.countDocuments({
        'subscription.plan': plan._id,
        'subscription.status': 'active',
      });
      planDistribution.push({
        planName: plan.name,
        count,
      });
    }

    // Include Free Tier users (no active plan)
    const freeTierCount = await User.countDocuments({
      $or: [
        { 'subscription.plan': null },
        { 'subscription.status': { $ne: 'active' } }
      ]
    });
    planDistribution.push({
      planName: 'Free / Muted',
      count: freeTierCount,
    });

    // 4. Top 5 Most Viewed Contents
    const topContent = await Content.find({})
      .sort({ views: -1 })
      .limit(5)
      .select('title type views rating thumbnailUrl');

    // 5. Recent Transactions
    const recentTransactions = await Transaction.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .populate('plan', 'name price');

    res.json({
      summary: {
        totalUsers,
        totalContent,
        activeSubscribers,
        totalRevenue,
      },
      planDistribution,
      topContent,
      recentTransactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get list of all users for User Management
// @route   GET /api/analytics/users
// @access  Private/Admin
const getUsersList = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .populate('subscription.plan');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a user's subscription or role
// @route   PUT /api/analytics/users/:id
// @access  Private/Admin
const updateUserByAdmin = async (req, res) => {
  const { role, subscriptionStatus, planId } = req.body;

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (role) {
      user.role = role;
    }

    if (subscriptionStatus) {
      user.subscription.status = subscriptionStatus;
      if (subscriptionStatus === 'inactive') {
        user.subscription.plan = null;
        user.subscription.startDate = null;
        user.subscription.endDate = null;
      }
    }

    if (planId) {
      const plan = await Plan.findById(planId);
      if (plan) {
        user.subscription.plan = plan._id;
        user.subscription.status = 'active';
        user.subscription.startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + plan.durationMonths);
        user.subscription.endDate = endDate;
      }
    }

    await user.save();
    const updatedUser = await User.findById(user._id).populate('subscription.plan');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/analytics/users/:id
// @access  Private/Admin
const deleteUserByAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin users' });
    }

    await User.deleteOne({ _id: user._id });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAnalytics,
  getUsersList,
  updateUserByAdmin,
  deleteUserByAdmin,
};
