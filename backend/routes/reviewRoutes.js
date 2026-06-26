const express = require('express');
const router = express.Router();
const {
  addReview,
  getContentReviews,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.get('/:id', getContentReviews);
router.post('/:id', protect, addReview);
router.delete('/:reviewId', protect, deleteReview);

module.exports = router;
