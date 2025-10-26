// Example: questionController.js
const { query, getClient } = require('../config/dbConfig');

// Get all questions
async function getQuestions(req, res) {
  try {
    const { rows } = await query(`
      SELECT q.*, u.username, 
             (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.id) as answer_count
      FROM questions q
      JOIN users u ON q.user_id = u.id
      ORDER BY q.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error getting questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
}

// Create a question (example with transaction)
async function createQuestion(req, res) {
  const { title, content, tags } = req.body;
  const userId = req.user.id; // Assuming you have user authentication
  
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // Insert question
    const { rows: [question] } = await client.query(
      `INSERT INTO questions (title, content, user_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, content, userId]
    );

    // Handle tags if needed
    if (tags && tags.length > 0) {
      // Your tag handling logic here
    }

    await client.query('COMMIT');
    res.status(201).json(question);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Failed to create question' });
  } finally {
    client.release();
  }
}

module.exports = {
  getQuestions,
  createQuestion
  // ... other controller methods
};