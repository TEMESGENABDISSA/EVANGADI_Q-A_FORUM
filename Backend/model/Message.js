const dbConnection = require("../config/dbConfig");

// Create messages table if it doesn't exist
const createMessagesTable = async () => {
  try {
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId VARCHAR(255) NOT NULL,
        role ENUM('user', 'model') NOT NULL,
        content TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Messages table checked/created successfully");
  } catch (error) {
    console.error("Error creating messages table:", error);
  }
};

// Initialize the table
createMessagesTable();

// Message model functions
const Message = {
  // Save a new message
  save: async (message) => {
    try {
      const [result] = await dbConnection.execute(
        "INSERT INTO messages (userId, role, content) VALUES (?, ?, ?)",
        [message.userId, message.role, message.content]
      );
      return { id: result.insertId, ...message };
    } catch (error) {
      console.error("Error saving message:", error);
      throw error;
    }
  },

  // Find messages by userId
  find: async (criteria) => {
    try {
      let query = "SELECT * FROM messages";
      const params = [];

      if (criteria && criteria.userId) {
        query += " WHERE userId = ?";
        params.push(criteria.userId);
      }

      query += " ORDER BY createdAt ASC";

      const [rows] = await dbConnection.execute(query, params);
      return rows;
    } catch (error) {
      console.error("Error finding messages:", error);
      throw error;
    }
  },

  // Delete messages by userId
  deleteMany: async (criteria) => {
    try {
      if (!criteria || !criteria.userId) {
        throw new Error("userId is required for deletion");
      }

      const [result] = await dbConnection.execute(
        "DELETE FROM messages WHERE userId = ?",
        [criteria.userId]
      );
      return result;
    } catch (error) {
      console.error("Error deleting messages:", error);
      throw error;
    }
  }
};

module.exports = Message;