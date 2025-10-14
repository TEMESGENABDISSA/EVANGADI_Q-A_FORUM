const OpenAI = require("openai");
const dbConnection = require("../config/dbConfig");

// Initialize OpenAI client
const openai = new OpenAI.OpenAIApi({
  apiKey: process.env.OPENAI_API_KEY,
});

// Save message to DB
async function saveMessage(userId, sender, message) {
  await dbConnection.execute(
    "INSERT INTO chat_messages (userId, sender, message) VALUES (?, ?, ?)",
    [userId, sender, message]
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

    // Get AI response
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: message },
      ],
      max_tokens: 200,
    });

    const aiMessage = response.choices[0].message.content;

    // Save AI response
    await saveMessage(userId, "bot", aiMessage);

    res.json({ response: aiMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get AI response" });
  }
};

// Get previous messages
exports.getMessages = async (req, res) => {
  const userId = req.params.userId;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const [rows] = await dbConnection.execute(
      "SELECT sender, message, createdAt FROM chat_messages WHERE userId = ? ORDER BY createdAt ASC",
      [userId]
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
    await dbConnection.execute("DELETE FROM chat_messages WHERE userId = ?", [
      userId,
    ]);
    res.json({ message: "Chat cleared" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to clear messages" });
  }
};
