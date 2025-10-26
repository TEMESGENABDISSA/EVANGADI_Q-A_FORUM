const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedDatabase() {
  // Create a connection to the database
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
    ssl: {
      ca: process.env.SSL_CA,
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🌱 Starting database seeding...');

    // Start a transaction
    await connection.beginTransaction();

    // 1. Insert sample users or get existing ones
    console.log('👥 Adding sample users...');
    const users = [
      {
        username: 'johndoe',
        email: 'john@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        bio: 'Software Developer',
        profilePicture: 'https://i.pravatar.cc/150?img=1'
      },
      {
        username: 'janedoe',
        email: 'jane@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        bio: 'Web Designer',
        profilePicture: 'https://i.pravatar.cc/150?img=2'
      },
      {
        username: 'bobsmith',
        email: 'bob@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        bio: 'DevOps Engineer',
        profilePicture: 'https://i.pravatar.cc/150?img=3'
      }
    ];

    const userIds = [];
    for (const user of users) {
      const [result] = await connection.query(
        `INSERT INTO users 
         (username, email, password, bio, profilePicture, createdAt, updatedAt, isActive, reputation)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW(), 1, 100)
         ON DUPLICATE KEY UPDATE updatedAt = NOW()`, 
        [user.username, user.email, user.password, user.bio, user.profilePicture]
      );
      
      // Get the user ID (either inserted or existing)
      const [rows] = await connection.query('SELECT userid FROM users WHERE username = ?', [user.username]);
      userIds.push(rows[0].userid);
    }

    // 2. Insert sample questions
    console.log('❓ Adding sample questions...');
    const questions = [
      {
        questionid: 'q1',
        userIndex: 0, // Index of the user in the userIds array
        title: 'How do I center a div in CSS?',
        description: 'I\'ve been trying to center a div both horizontally and vertically.',
        tag: 'CSS',
        view_count: 15,
        isResolved: 0
      },
      {
        questionid: 'q2',
        userIndex: 1, // Index of the user in the userIds array
        title: 'What is the best way to learn React in 2025?',
        description: 'I\'m new to React and want to learn it properly.',
        tag: 'React',
        view_count: 42,
        isResolved: 0
      },
      {
        questionid: 'q3',
        userIndex: 2, // Index of the user in the userIds array
        title: 'How to optimize MySQL queries?',
        description: 'I have a query that\'s running slow. How can I optimize it?',
        tag: 'MySQL',
        view_count: 28,
        isResolved: 1
      }
    ];

    for (const q of questions) {
      const userId = userIds[q.userIndex];
      await connection.query(
        `INSERT INTO questions 
         (questionid, userid, title, description, tag, created_at, updated_at, view_count, isResolved)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)
         ON DUPLICATE KEY UPDATE updated_at = NOW()`, 
        [q.questionid, userId, q.title, q.description, q.tag, q.view_count, q.isResolved]
      );
    }

    // 3. Insert sample answers
    console.log('💬 Adding sample answers...');
    const answers = [
      {
        answerid: 'a1',
        questionid: 'q1',
        userIndex: 1, // janedoe
        answer: 'You can center a div using flexbox. Here is an example:',
        is_accepted: 1
      },
      {
        answerid: 'a2',
        questionid: 'q2',
        userIndex: 0, // johndoe
        answer: 'I recommend starting with the official React documentation. It\'s been completely revamped and is now more beginner-friendly than ever!',
        is_accepted: 0
      },
      {
        answerid: 'a3',
        questionid: 'q2',
        userIndex: 2, // bobsmith
        answer: 'Check out the new React Learning Path on the official website. Also, the free courses on Scrimba are excellent for visual learners!',
        is_accepted: 1
      },
      {
        answerid: 'a4',
        questionid: 'q3',
        userIndex: 1, // janedoe
        answer: 'Make sure you have proper indexes on the columns used in your WHERE, JOIN, and ORDER BY clauses. Also, use EXPLAIN to analyze your query execution plan.',
        is_accepted: 0
      }
    ];

    for (const a of answers) {
      const userId = userIds[a.userIndex];
      await connection.query(
        `INSERT INTO answers 
         (answerid, questionid, userid, answer, created_at, updated_at, is_accepted)
         VALUES (?, ?, ?, ?, NOW(), NOW(), ?)
         ON DUPLICATE KEY UPDATE updated_at = NOW()`,
        [a.answerid, a.questionid, userId, a.answer, a.is_accepted]
      );
    }

    // 4. Insert sample votes
    console.log('👍 Adding sample votes...');
    const votes = [
      { answerid: 'a1', userIndex: 2, vote_type: 'up' }, // bobsmith votes on a1
      { answerid: 'a2', userIndex: 2, vote_type: 'up' }, // bobsmith votes on a2
      { answerid: 'a3', userIndex: 0, vote_type: 'up' }, // johndoe votes on a3
      { answerid: 'a3', userIndex: 1, vote_type: 'up' }, // janedoe votes on a3
      { answerid: 'a4', userIndex: 0, vote_type: 'up' }  // johndoe votes on a4
    ];

    for (const v of votes) {
      const userId = userIds[v.userIndex];
      await connection.query(
        `INSERT INTO answer_votes 
         (answerid, userid, vote_type, created_at)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE vote_type = ?`,
        [v.answerid, userId, v.vote_type, v.vote_type]
      );
    }

    // 5. Insert sample tags if they don't exist
    console.log('🏷️  Adding sample tags...');
    const tags = [
      { name: 'JavaScript', description: 'JavaScript programming language', color: '#f1e05a' },
      { name: 'React', description: 'React library for building user interfaces', color: '#61dafb' },
      { name: 'Node.js', description: 'Node.js JavaScript runtime', color: '#68a063' },
      { name: 'CSS', description: 'Cascading Style Sheets', color: '#563d7c' },
      { name: 'MySQL', description: 'MySQL database', color: '#4479a1' },
      { name: 'Express', description: 'Express.js web framework', color: '#000000' }
    ];

    for (const t of tags) {
      await connection.query(
        `INSERT IGNORE INTO tags 
         (name, description, color, created_at)
         VALUES (?, ?, ?, NOW())`,
        [t.name, t.description, t.color]
      );
    }

    // 6. Link questions to tags
    console.log('🔗 Linking questions to tags...');
    const questionTags = [
      { questionId: 'q1', tagName: 'CSS' },
      { questionId: 'q2', tagName: 'React' },
      { questionId: 'q3', tagName: 'MySQL' }
    ];

    for (const qt of questionTags) {
      await connection.query(
        `INSERT IGNORE INTO question_tags (questionid, tag_id)
         SELECT q.questionid, t.id
         FROM questions q
         CROSS JOIN tags t
         WHERE q.questionid = ? AND t.name = ?`,
        [qt.questionId, qt.tagName]
      );
    }

    // Commit the transaction
    await connection.commit();
    console.log('✅ Database seeded successfully!');

  } catch (error) {
    // If there's an error, rollback the transaction
    await connection.rollback();
    console.error('❌ Error seeding database:', error);
  } finally {
    // Close the connection
    await connection.end();
    process.exit();
  }
}

// Run the seeder
seedDatabase();
