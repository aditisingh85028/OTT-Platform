const express = require('express');
const router = express.Router();
const {
  getContents,
  getFeaturedContents,
  getContentById,
  createContent,
  updateContent,
  deleteContent,
} = require('../controllers/contentController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const { upload } = require('../config/cloudinary');

router.get('/', getContents);
router.get('/featured', getFeaturedContents);
router.get('/:id', getContentById);

// Admin routes with image upload middleware
router.post('/', protect, admin, upload.single('thumbnail'), createContent);
router.put('/:id', protect, admin, upload.single('thumbnail'), updateContent);
router.delete('/:id', protect, admin, deleteContent);

module.exports = router;
