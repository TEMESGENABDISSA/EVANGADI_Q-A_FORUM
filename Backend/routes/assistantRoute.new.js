const express = require('express');
const router = express.Router();
const controller = require('../controller/assistantController.new');

// Test route
router.get('/test', controller.testRoute);

// Check Gemini configuration
router.get('/check-config', (req, res) => {
  const hasApiKey = !!process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'not set';
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  res.json({
    status: hasApiKey ? 'Gemini API key is set' : 'Gemini API key is NOT set',
    model: model,
    environment: nodeEnv,
    note: hasApiKey ? 'If you still see API key errors, check the key format and permissions' : 'Please set GEMINI_API_KEY in your .env file'
  });
});

// Chat with the assistant
router.post('/chat', controller.chatWithAssistant);

// Get chat history
router.get('/history/:userId', (req, res, next) => {
  console.log('History endpoint hit for user:', req.params.userId);
  next();
}, controller.getUserChatHistory);

module.exports = router;
