const express = require('express');
const router = express.Router();
const {
  getNotifications,
  createNotificationByAdmin,
  markAsRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

router.get('/', protect, getNotifications);
router.post('/', protect, admin, createNotificationByAdmin);
router.post('/read/:id', protect, markAsRead);

module.exports = router;
