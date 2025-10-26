const mysql = require("mysql2/promise");
require("dotenv").config();

async function fixDatabase() {
  let connection;

  try {
    // Create connection using your existing database config
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASS || process.env.DB_PASSWORD || "",
      database:
        process.env.DB_DATABASE || process.env.DB_NAME || "evangadiforum",
      charset: "utf8mb4_general_ci",
      multipleStatements: true,
    });

    console.log("🔗 Connected to database");

    // Ensure database and session use utf8mb4 for emoji support
    console.log("🔤 Forcing utf8mb4 on database and session...");
    await connection.query(`
      SET NAMES utf8mb4;
      ALTER DATABASE \`${
        process.env.DB_DATABASE || process.env.DB_NAME || "evangadiforum"
      }\`
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    // 0. Ensure chat_messages table/text column support utf8mb4
    console.log("💬 Ensuring chat_messages uses utf8mb4...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        sender VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    // Convert existing table/columns if table already exists
    await connection.execute(
      "ALTER TABLE chat_messages CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );
    await connection.execute(
      "ALTER TABLE chat_messages MODIFY message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL"
    );

    // 1. Create answer_votes table
    console.log("📊 Creating answer_votes table (if not exists)...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS answer_votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        answerid VARCHAR(255) NOT NULL,
        userid INT NOT NULL,
        vote_type ENUM('up', 'down') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_vote (answerid, userid),
        FOREIGN KEY (answerid) REFERENCES answers(answerid) ON DELETE CASCADE,
        FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    // 2. Add view_count column to questions
    console.log("👁️ Ensuring view_count column on questions...");
    await connection
      .query(
        "ALTER TABLE questions ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0"
      )
      .catch(() => {});

    // 3. Add is_accepted column to answers
    console.log("✅ Ensuring is_accepted column on answers...");
    await connection
      .query(
        "ALTER TABLE answers ADD COLUMN IF NOT EXISTS is_accepted TINYINT(1) DEFAULT 0"
      )
      .catch(() => {});

    // 4. Add tag column to questions
    console.log("🏷️ Ensuring tag column on questions...");
    await connection
      .query(
        "ALTER TABLE questions ADD COLUMN IF NOT EXISTS tag VARCHAR(100) DEFAULT 'General'"
      )
      .catch(() => {});

    // 5. Notifications table required by NotificationBell
    console.log("🔔 Creating notifications table (if not exists)...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        notificationid VARCHAR(255) NOT NULL,
        userid INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        related_question_id VARCHAR(255),
        related_answer_id VARCHAR(255),
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (userid),
        FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    console.log("\n🎉 Database schema updated successfully!");
  } catch (error) {
    console.error("❌ Error updating database:", error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Database connection closed");
    }
  }
}

// Run the fix
fixDatabase();
