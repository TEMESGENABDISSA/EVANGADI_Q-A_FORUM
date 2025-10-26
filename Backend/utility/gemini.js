const { GoogleGenerativeAI } = require("@google/generative-ai");
const dbConnection = require("../config/dbConfig");

// Initialize Gemini API with your API key and timeout settings
let genAI = null;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, {
      timeout: 30000, // 30 seconds timeout
      maxRetries: 3,
    });
    console.log('Gemini API initialized successfully');
  } else {
    console.warn('GEMINI_API_KEY not found in environment variables');
  }
} catch (error) {
  console.error('Failed to initialize Gemini API:', error.message);
}

// Cache a working model name
let resolvedModelName = null;

async function resolveSupportedModel() {
  if (!genAI) throw new Error("Gemini unavailable: no API key");
  if (resolvedModelName) {
    console.log('Using cached Gemini model:', resolvedModelName);
    return resolvedModelName;
  }
    // List of models to try, in order of preference
  const candidates = [
    "gemini-1.5-flash-latest", // Latest stable model
    "gemini-1.5-pro-latest",   // Alternative model
    "gemini-pro",              // Default production model
    "models/gemini-pro",       // Alternative format
    process.env.GEMINI_MODEL || ""  // Allow override via environment
  ].filter(Boolean);
  
  console.log('Trying Gemini models in this order:', candidates);

  let lastError;
  for (const name of candidates) {
    try {
      const model = genAI.getGenerativeModel({ model: name });
      await model.generateContent({
        contents: [{ role: "user", parts: [{ text: "ping" }] }],
      });
      resolvedModelName = name;
      return resolvedModelName;
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(
    `No supported Gemini model worked. ${lastError?.message || lastError}`
  );
}

// ------------------------
// Local Responder (no API)
// ------------------------
const FAQ = [
  {
    keys: ["how to ask", "ask question", "post question", "create question"],
    answer: [
      "How to ask a question on Evangadi Forum:",
      "1) Log in or sign up.",
      "2) Click ‘ASK QUESTIONS’ on the Home page.",
      "3) Add a clear title and detailed description (include code/errors).",
      "4) Choose a tag (e.g., JavaScript, React, Node).",
      "5) Submit. You can edit later if needed.",
    ].join("\n"),
  },
  {
    keys: [
      "edit question",
      "update question",
      "delete question",
      "remove question",
    ],
    answer: [
      "Editing or deleting a question:",
      "• Open your question page.",
      "• Use Edit to improve details; Save changes.",
      "• Use Delete to remove your question (if allowed).",
    ].join("\n"),
  },
  {
    keys: ["answer question", "post answer", "write answer"],
    answer: [
      "How to answer a question:",
      "1) Open the question page.",
      "2) Scroll to the answer form.",
      "3) Provide a clear, step-by-step solution.",
      "4) Include code snippets and references if helpful.",
      "5) Submit your answer.",
    ].join("\n"),
  },
  {
    keys: ["edit answer", "update answer", "delete answer"],
    answer: [
      "Editing or deleting your answer:",
      "• Go to the question page where your answer is posted.",
      "• Use Edit to fix or improve your answer.",
      "• Use Delete to remove your answer (if allowed).",
    ].join("\n"),
  },
  {
    keys: ["accept answer", "accepted answer", "mark as accepted"],
    answer: [
      "Accepting an answer:",
      "• As the question owner, select the answer that solved your problem.",
      "• Click ‘Accept’ to mark it as the official solution.",
      "• This helps others find the best answer quickly.",
    ].join("\n"),
  },
  {
    keys: ["vote", "upvote", "downvote", "voting rules"],
    answer: [
      "Voting:",
      "• Upvote helpful, accurate answers.",
      "• Downvote incorrect or low-quality content.",
      "• Voting improves visibility of the best solutions.",
    ].join("\n"),
  },
  {
    keys: ["notifications", "how notifications work", "notify"],
    answer: [
      "Notifications:",
      "• You get notified when someone answers your question.",
      "• Click the bell icon in the header to view notifications.",
      "• Mark notifications as read from the dropdown.",
    ].join("\n"),
  },
  {
    keys: ["dark mode", "light mode", "theme", "toggle theme"],
    answer: [
      "Dark/Light mode:",
      "• Use the Theme toggle in the header to switch.",
      "• The site remembers your preference across pages.",
      "• All pages are optimized for readability in both modes.",
    ].join("\n"),
  },
  {
    keys: ["search", "find question", "look up question"],
    answer: [
      "Searching questions:",
      "• Use the search input on the Questions page.",
      "• Try keywords found in titles, errors, or tags.",
      "• The chatbot can also suggest related questions automatically.",
    ].join("\n"),
  },
  {
    keys: ["tags", "how to tag", "choose tag", "topic"],
    answer: [
      "Using tags:",
      "• Select a tag that best describes your topic (e.g., React, MySQL).",
      "• Good tagging improves discoverability and response quality.",
    ].join("\n"),
  },
  {
    keys: ["signup", "sign up", "register", "create account"],
    answer: [
      "Create an account:",
      "• Go to Login → switch to Sign Up.",
      "• Enter your details and submit.",
      "• You can update your profile after logging in.",
    ].join("\n"),
  },
  {
    keys: ["login", "log in", "sign in"],
    answer: [
      "Logging in:",
      "• Open the Login page.",
      "• Enter email/username and password.",
      "• If you forgot your password, use ‘Forgot password’.",
    ].join("\n"),
  },
  {
    keys: [
      "invalid credentials",
      "can't login",
      "cannot login",
      "wrong password",
    ],
    answer: [
      "Fix ‘Invalid credentials’:",
      "• Ensure you typed the correct email/username and password.",
      "• After reset, use the NEW password (min 8 chars).",
      "• Check for leading/trailing spaces; try another browser if needed.",
    ].join("\n"),
  },
  {
    keys: ["reset password", "forgot password", "password reset"],
    answer: [
      "Resetting your password:",
      "• On Login, click ‘Forgot password’.",
      "• Enter your email; open the reset link sent to you.",
      "• Choose a new password and submit.",
    ].join("\n"),
  },
  {
    keys: ["profile", "username", "update profile", "change username"],
    answer: [
      "Profile updates:",
      "• After logging in, open your profile settings.",
      "• Update your display name and other details.",
      "• Save changes to apply across the forum.",
    ].join("\n"),
  },
  {
    keys: ["chatbot", "how to use chatbot", "assistant", "help"],
    answer: [
      "Using the chatbot:",
      "• Ask how to post, tag, or structure a question.",
      "• It can show related questions or guide you step-by-step.",
      "• If the AI is offline, it still answers using local knowledge.",
    ].join("\n"),
  },
  {
    keys: ["format code", "code block", "share code", "post code"],
    answer: [
      "Posting code effectively:",
      "• Include minimal, reproducible snippets.",
      "• Paste errors and indicate which line fails.",
      "• Explain expected vs actual behavior.",
    ].join("\n"),
  },
  {
    keys: ["report", "abuse", "spam", "policy"],
    answer: [
      "Reporting inappropriate content:",
      "• Use the report option on the post if available, or",
      "• Contact support with the question URL and details.",
      "• We act to keep the community helpful and respectful.",
    ].join("\n"),
  },
  {
    keys: ["privacy", "data", "gdpr", "security"],
    answer: [
      "Privacy and data:",
      "• We store questions, answers, and minimal profile info.",
      "• Passwords are hashed with bcrypt.",
      "• You can request data changes via support.",
    ].join("\n"),
  },
  {
    keys: ["mobile", "responsive", "phone", "tablet"],
    answer: [
      "Mobile responsiveness:",
      "• The forum is optimized for mobile, tablet, and desktop.",
      "• Use the same features on any device, including Dark/Light mode.",
    ].join("\n"),
  },
  {
    keys: ["services", "what does evangadi offer", "platform features"],
    answer: [
      "Services we offer:",
      "• A Q&A forum for programming and tech topics.",
      "• Community voting and accepted answers.",
      "• Notifications, tags, and search to find solutions.",
      "• A helpful chatbot for guidance and onboarding.",
    ].join("\n"),
  },
];

function matchFAQ(prompt) {
  try {
    // Handle different input types safely
    let promptStr = '';
    
    if (typeof prompt === 'string') {
      promptStr = prompt.trim().toLowerCase();
    } else if (prompt && typeof prompt === 'object') {
      // Handle case where prompt might be an object with a text property
      promptStr = (prompt.text || '').toString().trim().toLowerCase();
    } else {
      promptStr = String(prompt || '').trim().toLowerCase();
    }

    if (!promptStr) return null;

    // Check against FAQ entries
    for (const f of FAQ) {
      if (f.keys.some(k => promptStr.includes(k.toLowerCase()))) {
        return Array.isArray(f.answer) ? f.answer.join('\n') : f.answer;
      }
    }
    return null;
  } catch (error) {
    console.error('Error in matchFAQ:', error);
    return null;
  }
}

async function searchQuestions(query) {
  if (!query || query.trim().length < 2) return [];
  const like = `%${query.trim()}%`;
  try {
    const [rows] = await dbConnection.query(
      `SELECT questionid, title FROM questions 
       WHERE title LIKE ? OR description LIKE ? 
       ORDER BY createdAt DESC LIMIT 3`,
      [like, like]
    );
    return rows || [];
  } catch (e) {
    return [];
  }
}

async function localRespond(prompt) {
  try {
    // 1) Direct FAQ intent
    const faq = matchFAQ(prompt);
    if (faq) return faq;

    // 2) Try searching existing questions
    const found = await searchQuestions(prompt);
    if (found.length > 0) {
      const lines = [
        "I found related questions:",
        ...found.map(
          (q, i) => `${i + 1}) ${q.title} → /question/${q.questionid}`
        ),
        "\nIf these don't help, please add details about your error/code.",
      ];
      return lines.join("\n");
    }

    // 3) Default helpful guidance
    return [
      "I'm here to help with Evangadi Forum! Here are some things I can assist with:",
      "• Posting a question",
      "• Answering questions",
      "• Account registration and login",
      "• Forum navigation",
      "• Community guidelines",
      "\nWhat would you like to know more about?"
    ].join("\n");
  } catch (error) {
    console.error('Error in localRespond:', error);
    return "Sorry, I'm having trouble understanding your question. Please try rephrasing or asking something else.";
  }
}

// ------------------------
// Primary responder
// ------------------------
async function getGeminiResponse(prompt, history = []) {
  if (!genAI) {
    console.warn('Gemini API not initialized, using fallback response');
    return localRespond(prompt);
  }
  
  // Check if prompt is empty or too short
  if (!prompt || prompt.trim().length < 2) {
    return "I'm here to help! Could you please provide more details about what you need assistance with?";
  }
  
  // Log the incoming request for debugging
  console.log('Gemini API request:', {
    promptLength: prompt?.length || 0,
    historyLength: history?.length || 0,
    model: process.env.GEMINI_MODEL || 'default'
  });

  try {
    const modelName = await resolveSupportedModel();
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    // Extract text from prompt if it's an object
    const promptText = typeof prompt === 'object' ? (prompt.text || '') : String(prompt || '');
    
    // Prepare conversation history
    const chat = model.startChat({
      history: (Array.isArray(history) ? history : []).map(msg => ({
        role: msg.role || (msg.sender === 'user' ? 'user' : 'model'),
        parts: [{ text: msg.text || msg.message || '' }],
      })),
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    // Add system prompt as the first message if no history exists
    const systemPreamble = "You are a helpful assistant for the Evangadi Forum. " +
      "Your purpose is to help users navigate the forum, ask questions, and find answers. " +
      "Be friendly, concise, and professional in your responses.";

    // If no history, start with the system prompt
    if (!history || history.length === 0) {
      chat.history = [
        {
          role: 'user',
          parts: [{ text: systemPreamble }],
        },
        {
          role: 'model',
          parts: [{ text: 'Hello! I\'m your Evangadi Forum assistant. How can I help you today?' }],
        },
      ];
    }

    const RATE_LIMIT_MS = 1000; // 1 second between requests
    const now = Date.now();
    const timeSinceLastRequest = now - (rateLimit.lastRequest || 0);
  
    if (timeSinceLastRequest < RATE_LIMIT_MS) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest));
    }

    try {
      // Send the message and get the response
      const result = await chat.sendMessage(promptText);
      const response = await result.response;
      const text = response.text();
      
      if (!text) {
        console.warn('Empty response from Gemini API, falling back to local responder');
        return await localRespond(prompt);
      }
      
      return text;
    } catch (apiError) {
      console.error('Error calling Gemini API:', apiError);
      // Fall back to local responder when Gemini API call fails
      return await localRespond(prompt);
    }
  } catch (error) {
    console.error('Error in getGeminiResponse:', error);
    // Fall back to local responder for any other errors
    return await localRespond(prompt);
  }
}

// Make sure the function is defined before exporting
const publicAPI = {
  getGeminiResponse,
  // Add other functions you want to export here
};

module.exports = publicAPI;
