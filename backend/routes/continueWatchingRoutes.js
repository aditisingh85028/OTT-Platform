const express = require('express');
const router = express.Router();
const { updateWatchProgress } = require('../controllers/userActivityController');
const { protect } = require('../middleware/auth');

router.post('/', protect, updateWatchProgress);

module.exports = router;
