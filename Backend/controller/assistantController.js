const { GoogleGenerativeAI } = require('@google/generative-ai');
const { pool: dbConnection } = require('../config/dbConfig');

// Initialize Google's Generative AI
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// System prompt to guide the AI's behavior
const SYSTEM_PROMPT = `You are Evangadi Assistant, a helpful AI assistant for the Evangadi Forum. 
Your goal is to assist users with their questions about the forum, programming, and general knowledge.
Be friendly, concise, and helpful. If you don't know an answer, say so honestly.

Guidelines:
1. Keep responses clear and to the point
2. Format code snippets with proper syntax highlighting
3. If a question is off-topic, politely guide the conversation back to the forum's focus
4. Be encouraging and supportive to learners`;

// Chat history storage (in a real app, use a database)
const chatHistory = new Map();

// Get or create chat history for a user
const getChatHistory = (userId) => {
  if (!chatHistory.has(userId)) {
    chatHistory.set(userId, [
      {
        role: "user",
        parts: [{ text: SYSTEM_PROMPT }],
      },
      {
        role: "model",
        parts: [{ text: "Hello! I'm your Evangadi Forum assistant. How can I help you today?" }],
      },
    ]);
  }
  return chatHistory.get(userId);
};

// Process user message and generate response
exports.chatWithAssistant = async (req, res) => {
  const { message, userId = 'anonymous' } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'Message is required and must be a string' 
    });
  }

  try {
    if (!genAI) {
      console.error('GEMINI_API_KEY is not configured');
      return res.status(500).json({
        success: false,
        error: 'Chat service is not available at the moment',
      });
    }

    // Get or create chat history for this user
    const history = getChatHistory(userId);
    
    // Add user message to history
    history.push({
      role: 'user',
      parts: [{ text: message }],
    });

    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Start a chat session with the history
    const chat = model.startChat({
      history: history.slice(1), // Skip the system prompt in the chat history
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    // Send message to the model
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    // Add model's response to history
    history.push({
      role: 'model',
      parts: [{ text }],
    });

    // Save the last 10 messages to prevent context from growing too large
    if (history.length > 20) {
      // Keep the system prompt and the last 9 exchanges (18 messages)
      const systemPrompt = history[0];
      const recentHistory = history.slice(-18);
      chatHistory.set(userId, [systemPrompt, ...recentHistory]);
    }

    // Log the interaction (in a real app, you'd save this to a database)
    try {
      await dbConnection.execute(
        'INSERT INTO chat_history (user_id, message, response) VALUES (?, ?, ?)',
        [userId, message, text]
      );
    } catch (dbError) {
      console.error('Failed to save chat history:', dbError);
      // Continue even if saving to DB fails
    }

    res.json({
      success: true,
      response: text,
    });
  } catch (error) {
    console.error('Error in chatWithAssistant:', error);
    
    // Provide a fallback response if the API call fails
    const fallbackResponses = [
      "I'm having trouble connecting to the AI service. Please try again in a moment.",
      "I apologize, but I'm experiencing some technical difficulties. Could you try again later?",
      "I'm unable to process your request right now. Please try again shortly."
    ];
    
    res.status(500).json({
      success: false,
      error: 'Failed to process your message',
      response: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
    });
  }
};

// Get chat history for a user
exports.getUserChatHistory = async (req, res) => {
  const { userId = 'anonymous' } = req.params;
  
  try {
    const [rows] = await dbConnection.execute(
      'SELECT * FROM chat_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    
    res.json({
      success: true,
      history: rows.reverse(), // Return in chronological order
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat history',
    });
  }
};

