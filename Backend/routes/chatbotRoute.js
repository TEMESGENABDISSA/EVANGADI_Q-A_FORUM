const express = require('express');
const router = express.Router();
const chatbotController = require('../controller/chatbotController');

// Chatbot API endpoint
router.post('/', chatbotController.handleChatMessage);

module.exports = router;
