const express = require("express");
const router = express.Router();
const dbConnection = require("../config/dbConfig");
const { getGeminiResponse } = require("../utility/gemini");

// Coerce any incoming userId to a numeric DB-friendly value
// - Logged-in users should already be numeric (string or number)
// - Guests (ids like "guest-...") are mapped to 0
function coerceDbUserId(userId) {
  if (!userId) return 0;
  const idStr = String(userId);
  if (idStr.startsWith("guest-")) return 0;
  const n = Number(idStr);
  return Number.isFinite(n) ? n : 0;
}

// Helper: save a message into DB using a string userId (supports guests)
async function saveMessage(userId, sender, message) {
  if (!userId) throw new Error("userId is required");
  const dbUserId = coerceDbUserId(userId);
  await dbConnection.execute(
    "INSERT INTO chat_messages (userId, sender, message) VALUES (?, ?, ?)",
    [dbUserId, sender, message]
  );
}

// GET /api/v1/chat/:userId -> fetch conversation for that user
router.get("/chat/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const dbUserId = coerceDbUserId(userId);
    const [rows] = await dbConnection.execute(
      "SELECT id, sender, message, createdAt FROM chat_messages WHERE userId = ? ORDER BY createdAt ASC",
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
    // Save user message
    await saveMessage(userId, "user", message);

    // Fetch previous conversation for context
    const dbUserId = coerceDbUserId(userId);
    const [previous] = await dbConnection.execute(
      "SELECT sender, message FROM chat_messages WHERE userId = ? ORDER BY createdAt ASC",
      [dbUserId]
    );

    // Get AI response using Gemini
    const botReply = await getGeminiResponse(message, previous);

    // Save bot reply
    await saveMessage(userId, "bot", botReply);

    // Return reply
    res.json({ response: botReply });
  } catch (err) {
    console.error("POST /chat error:", err);
    res
      .status(500)
      .json({ error: err?.message || "Error connecting to AI or DB" });
  }
});

// DELETE /api/v1/chat/:userId -> clear messages
router.delete("/chat/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const dbUserId = coerceDbUserId(userId);
    await dbConnection.execute("DELETE FROM chat_messages WHERE userId = ?", [
      dbUserId,
    ]);
    res.json({ message: "Chat cleared successfully" });
  } catch (err) {
    console.error("DELETE /chat/:userId error:", err);
    res.status(500).json({ error: "Failed to clear chat" });
  }
});

module.exports = router;
