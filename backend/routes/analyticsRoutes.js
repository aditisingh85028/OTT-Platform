const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getUsersList,
  updateUserByAdmin,
  deleteUserByAdmin,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

// All routes are admin-only
router.use(protect);
router.use(admin);

router.get('/', getAnalytics);
router.get('/users', getUsersList);
router.put('/users/:id', updateUserByAdmin);
router.delete('/users/:id', deleteUserByAdmin);

module.exports = router;
