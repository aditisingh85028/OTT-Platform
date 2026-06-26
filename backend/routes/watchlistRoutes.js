const express = require('express');
const router = express.Router();
const {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} = require('../controllers/userActivityController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getWatchlist);
router.post('/:id', addToWatchlist);
router.delete('/:id', removeFromWatchlist);

module.exports = router;
