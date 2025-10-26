-- Evangadi Forum Database Schema (Fixed to match controller)
-- This schema matches the controller expectations exactly

-- Users table
CREATE TABLE IF NOT EXISTS users (
    userid INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    bio TEXT DEFAULT NULL,
    profile_picture VARCHAR(255) DEFAULT NULL,
    reputation INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    questionid VARCHAR(255) PRIMARY KEY,
    userid INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    tag VARCHAR(100) DEFAULT 'General',
    view_count INT DEFAULT 0,
    is_resolved BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE,
    INDEX idx_questions_userid (userid),
    INDEX idx_questions_createdAt (createdAt),
    INDEX idx_questions_tag (tag),
    INDEX idx_questions_view_count (view_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Answers table
CREATE TABLE IF NOT EXISTS answers (
    answerid VARCHAR(255) PRIMARY KEY,
    questionid VARCHAR(255) NOT NULL,
    userid INT NOT NULL,
    answer TEXT NOT NULL,
    is_accepted TINYINT(1) DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (questionid) REFERENCES questions(questionid) ON DELETE CASCADE,
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE,
    INDEX idx_answers_questionid (questionid),
    INDEX idx_answers_userid (userid),
    INDEX idx_answers_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Answer votes table
CREATE TABLE IF NOT EXISTS answer_votes (
    vote_id INT AUTO_INCREMENT PRIMARY KEY,
    answerid VARCHAR(255) NOT NULL,
    userid INT NOT NULL,
    vote_type ENUM('up', 'down') NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_answer_vote (userid, answerid),
    FOREIGN KEY (answerid) REFERENCES answers(answerid) ON DELETE CASCADE,
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE,
    INDEX idx_answer_votes_answerid (answerid),
    INDEX idx_answer_votes_userid (userid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    userid INT NOT NULL,
    message TEXT NOT NULL,
    response TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE,
    INDEX idx_chat_messages_userid (userid),
    INDEX idx_chat_messages_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    userid INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    related_id VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE,
    INDEX idx_notifications_userid (userid),
    INDEX idx_notifications_is_read (is_read),
    INDEX idx_notifications_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#007bff',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Question tags junction table
CREATE TABLE IF NOT EXISTS question_tags (
    questionid VARCHAR(255) NOT NULL,
    tag_id INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (questionid, tag_id),
    FOREIGN KEY (questionid) REFERENCES questions(questionid) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    userid INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE,
    INDEX idx_user_sessions_userid (userid),
    INDEX idx_user_sessions_token (token),
    INDEX idx_user_sessions_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default tags
INSERT IGNORE INTO tags (name, description, color) VALUES
('JavaScript', 'Questions about JavaScript programming', '#f7df1e'),
('React', 'Questions about React.js framework', '#61dafb'),
('Node.js', 'Questions about Node.js runtime', '#339933'),
('Python', 'Questions about Python programming', '#3776ab'),
('Database', 'Questions about databases and SQL', '#003b57'),
('CSS', 'Questions about CSS styling', '#1572b6'),
('HTML', 'Questions about HTML markup', '#e34f26'),
('General', 'General programming questions', '#6c757d');

-- Views for statistics
CREATE OR REPLACE VIEW question_stats AS
SELECT 
    q.questionid,
    q.title,
    u.username as author,
    COUNT(DISTINCT a.answerid) as answer_count,
    q.view_count,
    q.is_resolved,
    q.createdAt
FROM questions q
LEFT JOIN users u ON q.userid = u.userid
LEFT JOIN answers a ON q.questionid = a.questionid
GROUP BY q.questionid, q.title, u.username, q.view_count, q.is_resolved, q.createdAt;

CREATE OR REPLACE VIEW user_reputation AS
SELECT 
    u.userid,
    u.username,
    u.reputation,
    COUNT(DISTINCT q.questionid) as questions_asked,
    COUNT(DISTINCT a.answerid) as answers_given
FROM users u
LEFT JOIN questions q ON u.userid = q.userid
LEFT JOIN answers a ON u.userid = a.userid
GROUP BY u.userid, u.username, u.reputation;
