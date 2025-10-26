const express = require('express');
const router = express.Router();
const assistantController = require('../controller/assistantController');
// const { verifyToken } = require('../middleware/authMiddleware');

// Debug: Log the controller methods
console.log('Assistant Controller Methods:', {
  chatWithAssistant: typeof assistantController.chatWithAssistant,
  getUserChatHistory: typeof assistantController.getUserChatHistory
});

// Chat with the assistant
router.post('/chat', (req, res, next) => {
  console.log('Chat endpoint hit');
  next();
}, assistantController.chatWithAssistant);

// Get chat history (protected route)
router.get('/history/:userId', (req, res, next) => {
  console.log('History endpoint hit for user:', req.params.userId);
  next();
}, assistantController.getUserChatHistory);

module.exports = router;
