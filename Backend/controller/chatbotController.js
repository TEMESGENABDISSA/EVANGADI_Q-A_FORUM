const { StatusCodes } = require('http-status-codes');

/**
 * Chatbot Controller for Evangadi Forum
 * -------------------------------------
 * Provides intelligent, rule-based responses to user messages
 * (No external API integration — works entirely locally)
 */

// Welcome message for first-time users
const WELCOME_MESSAGE = `
🤖 WELCOME TO EVANGADI FORUM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hello! I'm your Evangadi Forum Assistant. I'm here to help you with:

QUESTIONS & ANSWERS
• Post questions
• Write answers
• Format code

FORUM NAVIGATION
• Find topics
• Join discussions
• Connect with others

ACCOUNT HELP
• Registration
• Login issues
• Password reset
• Profile setup
• Settings

What would you like to do first?`;

/**
 * Generate a chatbot response based on user input.
 * @param {string} message - User message
 * @param {boolean} isFirstMessage - Whether this is the user's first message
 * @returns {string} Formatted chatbot response
 */
const getResponse = (message, isFirstMessage) => {
  const userMsg = message.toLowerCase().trim();

  // First interaction: show welcome message
  if (isFirstMessage) return WELCOME_MESSAGE;

  // Basic greeting
  if (/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening))\b/i.test(userMsg)) {
    return `
👋 Hello there! 👋
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I'm your Evangadi Forum assistant! I can help you with:
• Posting questions
• Finding answers
• Navigating the forum
• Account help

What can I help you with today?`;
  }

  // Greeting and initial help
  if (/^\s*(hi|hello|hey|greetings|hola|hey there|hi there|good (morning|afternoon|evening))[\s,!.?]*$/i.test(userMsg)) {
    return `👋 Hello! I'm your Evangadi Forum Assistant. I can help you with:

QUESTIONS & ANSWERS
• Post questions
• Write answers
• Format code

ACCOUNT HELP
• Registration
• Login issues
• Password reset
• Profile settings

FORUM NAVIGATION
• Search for topics
• Filter questions
• Find popular discussions

What would you like to do?`;
  }

  // Login Help — narrower and avoids unrelated guidance
  if (/(how\s*to|want to|need to|help me|can i|how do i|login|sign in|log in)/i.test(userMsg) &&
      !/(forgot|forget|lost|reset|change|recover)/i.test(userMsg)) {
    return `
# 🔑 LOGIN HELP

1. **Click \"Login\"** (top-right corner/main page)
2. **Enter your credentials** (username/email & password)
3. **Click \"Login\"** to access your account

**Trouble logging in?**
- If you forgot your password, ask about \"forgot password\" for help.
- Check email/username spelling and Caps Lock.
- Still stuck? Contact support or register a new account.`;
  }

  // Password Reset Help — focused on password alone
  if (/(forgot|forget|lost|reset|change|recover).*(password|pass|pwd)/i.test(userMsg) || 
      /(password|pass|pwd).*(forgot|forget|lost|reset|change|recover)/i.test(userMsg) ||
      /(how\s*to|help me|can i|how do i).*(reset|change|recover).*(password|pass)/i.test(userMsg)) {
    return `
# 🔐 PASSWORD RESET GUIDE

Go to the login page and click \"Forgot password?\" below the password field. Enter your account email, check your inbox, and follow the reset link.\n
Trouble? Check your spam folder, wait a few minutes, or try again. For more help, contact support.`;
  }

  // Signup/Registration Help — focused only on how to register
  if (/(how\s*to|want to|need to|help me|can i|how do i|create|make|sign up).*(account|register|sign up|signup)/i.test(userMsg)) {
    return `
# ACCOUNT REGISTRATION

Click \"Sign Up\" in the top right or main page. Fill out your details (username, email, password), verify your email if required, and you're in! Already have an account? Try logging in.`;
  }

  // Posting a Question — only question help
  if (/(how\s*to|want to|need to|help me|can i|how do i|create|make|post|ask)\s+(a |my |new )?(question|post|query)/i.test(userMsg)) {
    return `
# HOW TO ASK A QUESTION

Click \"Ask Question\", enter a descriptive title and details, review your question, then submit. For better answers, explain your problem with details and code if relevant.`;
  }

  // Posting an Answer — only answer help
  if (/(how\s*to|want to|need to|help me|can i|how do i|post|write|answer|respond to).*\b(answer|reply|respond|solution)/i.test(userMsg)) {
    return `
# HOW TO POST AN ANSWER

Find a question, click the \"Answer\" button, write your answer clearly (with code/examples as needed), and submit. To improve your answer, be specific and constructive.`;
  }

  // Editing/Deleting a Post — only that action
  if (/(how\s*to|can i|help me|want to|need to|steps to|instruction).*(edit|update|delete|remove).*(my |a |their |this |that )?(post|question|answer|reply)/i.test(userMsg)) {
    return `
# EDIT OR DELETE YOUR POST

To edit: Go to your post and click the ✏️ Edit icon. To delete: Click the 🗑️ Delete icon and confirm. You must be the post’s author and logged in.`;
  }

  // Comment/React — focus only on that
  if (/(how\s*to|can i|help me|want to|need to|steps to|instruction).*(comment|reply|react|like|upvote|downvote|respond).*(post|question|answer|reply)?/i.test(userMsg)) {
    return `
# COMMENT OR REACT

To comment: Click the Comment button under a post and submit your comment. To react: Click 👍 or ❤️ (if available) on a post or answer. You may need to log in first.`;
  }
  
  // Platform Purpose/Q&A purpose — only that info
  if (/(what is|explain|about|purpose|meaning|define).*(evangadi|forum|platform)/i.test(userMsg)) {
    return `
Evangadi Forum is an open Q&A community for asking and answering questions, sharing knowledge, and helping others learn and succeed.`;
  }

  // How to Search for Questions
  if (/(how\s*to|want to|need to|help me|can i|how do i|find|look for|search).*\b(search|find|look up)/i.test(userMsg)) {
    return `
🔍 How to Search for Questions on Evangadi Forum

1. Use the search bar at the top  
2. Type your keywords  
   • Use quotes for exact phrases  
   • Add tags (e.g., [javascript], [react])  
3. Press Enter or click the search icon  
4. Filter results:  
   • Sort by newest, votes, or most viewed  
   • Filter by tags, unanswered, or user  

💡 Search Tips:  
✅ Use specific error messages  
✅ Include technology names  
✅ Check spelling and tags  
`;
  }

  // Forum Navigation
  if (/(navigate|find|where is|how to find|browse|use|explore)/i.test(userMsg)) {
    return `
EXPLORING THE FORUM

QUICK ACCESS
1. Home - Latest discussions
2. Questions - All topics
3. Tags - Browse by subject
4. Users - Meet the community

TIPS
- Use search for specific topics
- Sort by newest/trending
- Save useful posts
- Follow interesting tags`;
  }

  // Default Fallback Help
  return `
I'm here to help with Evangadi Forum! Here are a few things I can assist with:

• Posting a question – Learn how to ask effectively  
• Answering questions – Help others by sharing knowledge  
• Account help – Registration, login, password reset, and settings  
• Forum navigation – Find your way around easily  
• Community guidelines – Learn the rules and etiquette  

What would you like to know more about?  
`;
};

/**
 * Format response with enhanced Markdown support
 * @param {string} text - The text to format
 * @returns {string} Formatted text with proper spacing and structure
 */
const formatResponse = (text) => {
  if (!text) return '';
  if (/<[a-z][\s\S]*>/i.test(text)) return text; // keep HTML responses unchanged
  
  // Process markdown and add proper spacing
  return text
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    // Fix numbered lists spacing
    .replace(/(\d+)\.\s+/g, '$1. ')
    // Fix bullet points spacing
    .replace(/^\s*[-•*+]\s+/gm, '• ')
    // Fix indentation for list items
    .replace(/^\s{3}(?=[•\d])/gm, '  ')
    // Remove extra spaces after list markers
    .replace(/([•\d\.]) {2,}/g, '$1 ')
    // Convert markdown headers to bold with line breaks
    .replace(/^#\s+(.+)$/gm, '\n**$1**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    // Handle bold text
    .replace(/\*\*(.*?)\*\*/g, '**$1**')
    // Handle italic text
    .replace(/\*(.*?)\*/g, '*$1*')
    // Ensure consistent line breaks after sections
    .replace(/([.!?])(?=\s+[A-Z])/g, '$1\n\n')
    // Clean up excessive newlines (more than 2)
    .replace(/\n{3,}/g, '\n\n')
    // Add space after emojis at start of line
    .replace(/^(\p{Emoji}+)(\S)/gmu, '$1 $2')
    // Trim and clean up
    .trim();
};

/**
 * Handle chat message requests
 */
const handleChatMessage = async (req, res) => {
  try {
    const { message, isFirstMessage = false } = req.body;
    if (!message?.trim()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Message cannot be empty',
      });
    }

    // Generate and format the chatbot response
    const responseText = getResponse(message, isFirstMessage);
    const formattedResponse = formatResponse(responseText);

    return res.status(StatusCodes.OK).json({
      success: true,
      response: formattedResponse,
      // Add metadata for frontend rendering
      metadata: {
        format: 'markdown',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  } catch (error) {
    const errorId = `chat_${Date.now()}`;
    console.error('Error in handleChatMessage:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error processing chat message',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = { handleChatMessage };
