const express = require('express');
const router = express.Router();
const { handleChatbotQuery } = require('../controllers/chatbotController');
const { protect } = require('../middleware/auth');

router.post('/', protect, handleChatbotQuery);

module.exports = router;
