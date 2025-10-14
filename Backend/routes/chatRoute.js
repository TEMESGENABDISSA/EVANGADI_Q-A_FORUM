const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const dbConnection = require("../config/dbConfig");

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    "OPENAI_API_KEY not set — AI responses will fail until you add it to .env"
  );
}

// Create OpenAI client using new ES6 style
const openai = new OpenAI.OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper: save a message into DB
async function saveMessage(userId, sender, message) {
  // If user is guest, store null for integer userId in DB
  const dbUserId = userId === "guest" ? null : userId;
  await dbConnection.execute(
    "INSERT INTO chat_messages (userId, sender, message) VALUES (?, ?, ?)",
    [dbUserId, sender, message]
  );
}

// GET /api/v1/chat/:userId -> fetch conversation for that user
router.get("/chat/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const dbUserId = userId === "guest" ? null : userId;
    const [rows] = await dbConnection.execute(
      "SELECT id, sender, message, createdAt FROM chat_messages WHERE userId IS ? ORDER BY createdAt ASC",
      [dbUserId]
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /chat/:userId error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// POST /api/v1/chat -> send message, get AI reply
router.post("/chat", async (req, res) => {
  const { userId, message } = req.body;
  if (!message) return res.status(400).json({ error: "Missing message" });

  try {
    const dbUserId = userId === "guest" ? null : userId;

    // Save user message
    await saveMessage(userId, "user", message);

    // Fetch previous conversation for context
    const [previous] = await dbConnection.execute(
      "SELECT sender, message FROM chat_messages WHERE userId IS ? ORDER BY createdAt ASC",
      [dbUserId]
    );

    // Build messages for OpenAI
    const conversationMemory = [
      {
        role: "system",
        content:
          "You are a helpful assistant for Evangadi forum. Be concise and polite.",
      },
    ];

    for (const c of previous) {
      conversationMemory.push({
        role: c.sender === "user" ? "user" : "assistant",
        content: c.message,
      });
    }

    // Append latest user message
    conversationMemory.push({ role: "user", content: message });

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: conversationMemory,
      max_tokens: 400,
      temperature: 0.2,
    });

    const botReply =
      response?.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't generate a response right now.";

    // Save bot reply
    await saveMessage(userId, "bot", botReply);

    // Return reply
    res.json({ response: botReply });
  } catch (err) {
    console.error("POST /chat error:", err);
    res.status(500).json({ error: "Error connecting to AI or DB" });
  }
});

// DELETE /api/v1/chat/:userId -> clear messages
router.delete("/chat/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const dbUserId = userId === "guest" ? null : userId;
    await dbConnection.execute("DELETE FROM chat_messages WHERE userId IS ?", [
      dbUserId,
    ]);
    res.json({ message: "Chat cleared successfully" });
  } catch (err) {
    console.error("DELETE /chat/:userId error:", err);
    res.status(500).json({ error: "Failed to clear chat" });
  }
});

module.exports = router;
