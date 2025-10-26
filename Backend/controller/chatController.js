const { pool: dbConnection } = require("../config/dbConfig");
const { getGeminiResponse } = require("../utility/gemini");

// Format response with proper markdown and structure
const formatResponse = (text) => {
  if (!text) return '';
  
  // Preserve any existing markdown formatting
  return text
    // Convert markdown headers to bold with line breaks
    .replace(/^#\s+(.+)$/gm, '**$1**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    // Convert markdown lists to bullet points
    .replace(/^\s*[-*+]\s+(.+)$/gm, '• $1')
    // Ensure double line breaks between paragraphs
    .replace(/\n{3,}/g, '\n\n')
    // Preserve code blocks
    .replace(/```(\w*)([\s\S]*?)```/g, '```$1$2```');
};

// Save message to DB
function coerceDbUserId(userId) {
  if (!userId) return 0;
  const idStr = String(userId);
  if (idStr.startsWith("guest-")) return 0;
  const n = Number(idStr);
  return Number.isFinite(n) ? n : 0;
}

async function saveMessage(userId, sender, message) {
  if (!userId) throw new Error("userId is required");
  const dbUserId = coerceDbUserId(userId);
  await dbConnection.execute(
    "INSERT INTO chat_messages (userId, sender, message) VALUES (?, ?, ?)",
    [dbUserId, sender, message]
  );
}

// Chat with AI
exports.chatWithAI = async (req, res) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: "Missing userId or message" });
  }

  try {
    // Save user message
    await saveMessage(userId, "user", message);

    // Get previous conversation for context
    const dbUserId = coerceDbUserId(userId);
    const [previous] = await dbConnection.execute(
      "SELECT sender, message FROM chat_messages WHERE userId = ? ORDER BY createdAt ASC LIMIT 10",
      [dbUserId]
    );

    // Get AI response using Gemini
    let aiMessage = await getGeminiResponse(message, previous);
    
    // Format the response with markdown if not already formatted
    if (!aiMessage.includes('```') && !aiMessage.includes('**')) {
      aiMessage = formatResponse(aiMessage);
    }

    // Save AI response
    await saveMessage(userId, "bot", aiMessage);

    // Return formatted response
    res.json({ 
      response: aiMessage,
      formatted: true,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: err?.message || "Failed to get AI response" });
  }
};

// Get previous messages
exports.getMessages = async (req, res) => {
  const userId = req.params.userId;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const dbUserId2 = coerceDbUserId(userId);
    const [rows] = await dbConnection.execute(
      "SELECT sender, message, createdAt FROM chat_messages WHERE userId = ? ORDER BY createdAt ASC",
      [dbUserId2]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// Clear chat history
exports.clearMessages = async (req, res) => {
  const userId = req.params.userId;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const dbUserId3 = coerceDbUserId(userId);
    await dbConnection.execute("DELETE FROM chat_messages WHERE userId = ?", [
      dbUserId3,
    ]);
    res.json({ message: "Chat cleared" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to clear messages" });
  }
};
