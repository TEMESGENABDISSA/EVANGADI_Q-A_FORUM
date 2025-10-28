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

  // How to Ask a Question
  if (/(how\s*to|want to|need to|help me|can i|how do i|create|make|post|ask)\s+(a |my |new )?(question|post|query)/i.test(userMsg)) {
    return `
# HOW TO ASK A QUESTION ON EVANGADI FORUM

1. **Click "Ask Question"**
   - Find the button in the top navigation
   - Or use the "Ask Question" button on the home page

2. **Enter Your Question**
   - **Title**: Be specific about your problem
   - **Details**: Include all relevant information
   - **Code**: Use code blocks for technical questions
   - **Tags**: Add relevant tags

3. **Preview Your Question**
   - Check the preview panel
   - Verify formatting is correct
   - Ensure code is properly formatted
   - Check for typos or missing information

4. **Edit if Needed**
   - Click "Edit" to make changes
   - Fix any formatting issues
   - Add any missing details
   - Preview again after changes

5. **Submit Your Question**
   - Click "Post Your Question"
   - Wait for the page to refresh
   - Your question is now live!

# TIPS FOR BETTER RESPONSES:
- Be clear and specific
- Include error messages
- Show what you've tried
- Format code properly
- Keep it concise but complete

Need help with something specific about your question? Just ask!`;
  }

  // How to Post an Answer
  if (/(how\s*to|want to|need to|help me|can i|how do i|post|write|answer|respond to).*\b(answer|reply|respond|solution)/i.test(userMsg)) {
    return `
# HOW TO POST AN ANSWER ON EVANGADI FORUM

1. **Find a Question**
   - Browse the questions list
   - Look for unanswered questions
   - Or search for specific topics

2. **Write Your Answer**
   - Click on the "Answer" button below the question
   - Use the editor to format your response
   - Include code snippets in code blocks
   - Add relevant examples

3. **Format Your Answer**
   - Use markdown for formatting
   - Add headings for structure
   - Include bullet points for clarity
   - Highlight important information

4. **Before Submitting**
   - Review for accuracy
   - Check code formatting
   - Ensure your answer is complete
   - Be respectful and professional

5. **Post Your Answer**
   - Click "Post Your Answer"
   - Wait for the page to refresh
   - Your answer is now visible to everyone!

# TIPS FOR GREAT ANSWERS:
- Be clear and concise
- Provide working solutions
- Explain your reasoning
- Include relevant examples
- Be kind and constructive`;
  }

  // How to Register an Account
  if (/(how\s*to|want to|need to|help me|can i|how do i|create|make|sign up).*\b(account|register|sign up|signup)/i.test(userMsg)) {
    return `
ACCOUNT REGISTRATION

1. Click "Sign Up"
   - Top-right corner
   - Or main page button

2. Enter your details
   - Username
   - Email
   - Password

3. Verify email
   - Check your inbox
   - Click verification link

4. Complete profile
   - Add a photo
   - Set preferences
   - Explore the forum`;
  }

  // Password Reset Help
  if (/(forgot|forget|lost|reset|change|recover).*\b(password|pass|pwd)/i.test(userMsg) || 
      /(password|pass|pwd).*\b(forgot|forget|lost|reset|change|recover)/i.test(userMsg) ||
      /(how\s*to|help me|can i|how do i).*\b(reset|change|recover).*\b(password|pass)/i.test(userMsg)) {
    return `
# 🔐 PASSWORD RESET GUIDE

## STEP 1: REQUEST RESET LINK
1. **Go to Login Page**
   - Click "Login" in the top-right corner
   - Or visit the login page directly

2. **Click "Forgot Password?"**
   - Look for the link below the password field
   - Click on "Forgot password?" text

3. **Enter Your Email**
   - Type the email address associated with your account
   - Make sure it's the same email you used to register

4. **Click "Send Reset Link"**
   - Wait for the confirmation message
   - Check your email inbox (including spam folder)

## STEP 2: CHECK YOUR EMAIL
1. **Look for Email**
   - Subject: "Password Reset - Evangadi Forum"
   - From: Evangadi Forum
   - Check spam/junk folder if not in inbox

2. **Click Reset Link**
   - Click the blue "Reset Password" button
   - Or copy the link and paste in browser

## STEP 3: CREATE NEW PASSWORD
1. **Enter New Password**
   - Must be at least 8 characters
   - Use a strong, unique password

2. **Confirm Password**
   - Re-enter the same password
   - Make sure both passwords match

3. **Click "Reset Password"**
   - Wait for success message
   - You'll be redirected to login page

## STEP 4: LOGIN WITH NEW PASSWORD
1. **Go to Login Page**
2. **Enter Credentials**
   - Username or email
   - Your new password
3. **Click "Login"**

## 🚨 TROUBLESHOOTING
**No Email Received?**
- Check spam/junk folder
- Wait 5-10 minutes
- Try requesting again
- Contact support if still no email

**Link Expired?**
- Reset links expire after 1 hour
- Request a new reset link
- Use the same email address

**Still Having Issues?**
- Make sure you're using the correct email
- Check your internet connection
- Try a different browser
- Contact support for help

Need more help? Just ask!`;
  }

  // Login Help
  if (/(how\s*to|want to|need to|help me|can i|how do i|login|sign in|log in)/i.test(userMsg) && 
      !/(forgot|forget|lost|reset|change|recover)/i.test(userMsg)) {
    return `
# 🔑 LOGIN HELP

## HOW TO LOGIN
1. **Click "Login"**
   - Top-right corner of the page
   - Or main page login button

2. **Enter Your Credentials**
   - **Username or Email**: Use either one
   - **Password**: Your account password

3. **Click "Login"**
   - Wait for authentication
   - You'll be redirected to the home page

## LOGIN TROUBLESHOOTING
**Can't Remember Password?**
- Click "Forgot password?" below the password field
- Follow the password reset process

**Wrong Credentials?**
- Check your username/email spelling
- Make sure Caps Lock is off
- Try typing password in a text editor first

**Account Not Found?**
- Make sure you're using the correct email
- Check if you need to register first
- Try different variations of your username

**Still Having Issues?**
- Clear browser cache and cookies
- Try a different browser
- Check your internet connection
- Contact support for help

Need password reset help? Just ask about "forgot password"!`;
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
