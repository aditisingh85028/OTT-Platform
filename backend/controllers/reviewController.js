const Review = require('../models/Review');
const Content = require('../models/Content');

// Helper function to update content ratings
const updateContentRating = async (contentId) => {
  const reviews = await Review.find({ content: contentId });
  const numReviews = reviews.length;
  const averageRating =
    numReviews > 0
      ? reviews.reduce((acc, item) => item.rating + acc, 0) / numReviews
      : 0;

  await Content.findByIdAndUpdate(contentId, {
    rating: Number(averageRating.toFixed(1)),
    numReviews,
  });
};

// @desc    Add review & rating
// @route   POST /api/reviews/:id
// @access  Private
const addReview = async (req, res) => {
  const { rating, comment } = req.body;
  const contentId = req.params.id;

  try {
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Check if user already reviewed this content
    const alreadyReviewed = await Review.findOne({
      user: req.user._id,
      content: contentId,
    });

    if (alreadyReviewed) {
      // If already reviewed, we can update it
      alreadyReviewed.rating = Number(rating);
      alreadyReviewed.comment = comment;
      await alreadyReviewed.save();

      await updateContentRating(contentId);
      return res.json({ message: 'Review updated successfully', review: alreadyReviewed });
    }

    const review = new Review({
      user: req.user._id,
      userName: req.user.name,
      content: contentId,
      rating: Number(rating),
      comment,
    });

    const createdReview = await review.save();

    // Update Content average rating & number of reviews
    await updateContentRating(contentId);

    res.status(201).json({ message: 'Review added successfully', review: createdReview });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all reviews for a content
// @route   GET /api/reviews/:id
// @access  Public
const getContentReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ content: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:reviewId
// @access  Private (Owner/Admin)
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user is owner or admin
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    const contentId = review.content;
    await Review.deleteOne({ _id: review._id });

    // Recalculate average rating for Content
    await updateContentRating(contentId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addReview,
  getContentReviews,
  deleteReview,
};
