const User = require('../models/User');
const Content = require('../models/Content');

// --- WATCHLIST CONTROLLERS ---

// @desc    Get user watchlist
// @route   GET /api/watchlist
// @access  Private
const getWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('watchlist');
    if (user) {
      res.json(user.watchlist);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add item to watchlist
// @route   POST /api/watchlist/:id
// @access  Private
const addToWatchlist = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    const user = await User.findById(req.user._id);
    if (user.watchlist.includes(content._id)) {
      return res.status(400).json({ message: 'Already in watchlist' });
    }

    user.watchlist.push(content._id);
    await user.save();
    res.json({ message: 'Added to watchlist', watchlist: user.watchlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove item from watchlist
// @route   DELETE /api/watchlist/:id
// @access  Private
const removeFromWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.watchlist = user.watchlist.filter(
      (item) => item.toString() !== req.params.id
    );

    await user.save();
    res.json({ message: 'Removed from watchlist', watchlist: user.watchlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- CONTINUE WATCHING CONTROLLERS ---

// @desc    Update watch progress (Continue Watching)
// @route   POST /api/continue-watching
// @access  Private
const updateWatchProgress = async (req, res) => {
  const { contentId, progress, duration } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the movie is completed (>95% progress)
    const isCompleted = duration > 0 && (progress / duration) > 0.95;

    // Remove existing entry first if it exists
    user.continueWatching = user.continueWatching.filter(
      (item) => item.content.toString() !== contentId
    );

    // If it's not completed, add it to the front of the list
    if (!isCompleted && progress > 5) {
      user.continueWatching.unshift({
        content: contentId,
        progress: Number(progress),
        duration: Number(duration),
        updatedAt: Date.now(),
      });
    }

    // Keep continueWatching list bounded (e.g., max 15 items)
    if (user.continueWatching.length > 15) {
      user.continueWatching.pop();
    }

    await user.save();
    res.json({ message: 'Watch progress updated', continueWatching: user.continueWatching });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  updateWatchProgress,
};
