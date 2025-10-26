const dbConnection = require('../config/dbConfig');
const gemini = require('../utility/gemini');
const getGeminiResponse = gemini.getGeminiResponse;

// Simple test controller
exports.testRoute = (req, res) => {
  console.log('Test route hit!');
  res.json({ success: true, message: 'Test route working!' });
};

// Chat with the assistant
exports.chatWithAssistant = async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('Chat request received:', {
      body: req.body,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
    
    const { message, userId } = req.body;
    
    if (!message) {
      console.warn('Empty message received');
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if we're in development mode and use a mock response if needed
    if (process.env.NODE_ENV === 'development' && !process.env.GEMINI_API_KEY) {
      console.warn('Using mock response - GEMINI_API_KEY not set');
      return res.json({
        success: true,
        response: `[MOCK] You said: ${message}`,
        timestamp: new Date().toISOString(),
        debug: { isMock: true }
      });
    }
    
    // Get response from Gemini
    const response = await getGeminiResponse(message);
    
    console.log('Chat response sent in', Date.now() - startTime, 'ms');
    
    res.json({
      success: true,
      response: response,
      timestamp: new Date().toISOString(),
      debug: process.env.NODE_ENV === 'development' ? {
        model: process.env.GEMINI_MODEL,
        processingTime: `${Date.now() - startTime}ms`
      } : undefined
    });
  } catch (error) {
    console.error('Error in chatWithAssistant:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process message',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
      debug: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        processingTime: `${Date.now() - startTime}ms`
      } : undefined
    });
  }
};

// Get chat history
exports.getUserChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching history for user:', userId);
    
    // Return a mock response for now
    res.json({
      success: true,
      history: [
        {
          id: 1,
          message: 'Hello!',
          response: 'Hi there! How can I help you today?',
          timestamp: new Date().toISOString()
        }
      ]
    });
  } catch (error) {
    console.error('Error in getUserChatHistory:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch chat history',
      details: error.message 
    });
  }
};
