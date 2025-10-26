-- Evangadi Forum Database Schema
-- This file contains the complete database structure for the Evangadi Forum

-- Create database (run this first)
-- CREATE DATABASE IF NOT EXISTS evangadiforum;
-- USE evangadiforum;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    userid INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    isActive BOOLEAN DEFAULT TRUE,
    profilePicture VARCHAR(255) DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    reputation INT DEFAULT 0
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    questionid VARCHAR(255) PRIMARY KEY,
    userid INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    tag VARCHAR(100) DEFAULT 'General',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    view_count INT DEFAULT 0,
    isResolved BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
);

-- Answers table
CREATE TABLE IF NOT EXISTS answers (
    answerid VARCHAR(255) PRIMARY KEY,
    questionid VARCHAR(255) NOT NULL,
    userid INT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_accepted TINYINT(1) DEFAULT 0,
    FOREIGN KEY (questionid) REFERENCES questions(questionid) ON DELETE CASCADE,
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
);

-- Answer votes table
CREATE TABLE IF NOT EXISTS answer_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    answerid VARCHAR(255) NOT NULL,
    userid INT NOT NULL,
    vote_type ENUM('up', 'down') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_vote (answerid, userid),
    FOREIGN KEY (answerid) REFERENCES answers(answerid) ON DELETE CASCADE,
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    sender ENUM('user', 'bot') NOT NULL,
    message TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(userid) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userid INT NOT NULL,
    type ENUM('answer', 'vote', 'accepted', 'mention') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_question_id VARCHAR(255) DEFAULT NULL,
    related_answer_id VARCHAR(255) DEFAULT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE,
    FOREIGN KEY (related_question_id) REFERENCES questions(questionid) ON DELETE CASCADE,
    FOREIGN KEY (related_answer_id) REFERENCES answers(answerid) ON DELETE CASCADE
);

-- Tags table (for better tag management)
CREATE TABLE IF NOT EXISTS tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT DEFAULT NULL,
    color VARCHAR(7) DEFAULT '#007bff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Question tags relationship table
CREATE TABLE IF NOT EXISTS question_tags (
    questionid VARCHAR(255) NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (questionid, tag_id),
    FOREIGN KEY (questionid) REFERENCES questions(questionid) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- User sessions table (for better session management)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userid INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
);

-- Insert default tags
INSERT IGNORE INTO tags (name, description, color) VALUES
('General', 'General questions and discussions', '#6c757d'),
('React', 'React.js related questions', '#61dafb'),
('JavaScript', 'JavaScript programming questions', '#f7df1e'),
('Node.js', 'Node.js backend development', '#339933'),
('Database', 'Database design and queries', '#336791'),
('CSS', 'CSS styling and design', '#1572b6'),
('HTML', 'HTML markup and structure', '#e34f26'),
('Python', 'Python programming questions', '#3776ab'),
('Java', 'Java programming questions', '#007396'),
('PHP', 'PHP web development', '#777bb4'),
('MySQL', 'MySQL database questions', '#4479a1'),
('MongoDB', 'MongoDB database questions', '#47a248'),
('API', 'API development and integration', '#ff6b6b'),
('Git', 'Version control with Git', '#f05032'),
('Docker', 'Containerization with Docker', '#2496ed'),
('AWS', 'Amazon Web Services', '#ff9900'),
('Azure', 'Microsoft Azure cloud services', '#0078d4'),
('Linux', 'Linux system administration', '#fcc624'),
('Windows', 'Windows system questions', '#0078d4'),
('Mobile', 'Mobile app development', '#34a853');

-- Create indexes for better performance
CREATE INDEX idx_questions_userid ON questions(userid);
CREATE INDEX idx_questions_created_at ON questions(created_at);
CREATE INDEX idx_questions_tag ON questions(tag);
CREATE INDEX idx_questions_view_count ON questions(view_count);
CREATE INDEX idx_answers_questionid ON answers(questionid);
CREATE INDEX idx_answers_userid ON answers(userid);
CREATE INDEX idx_answers_created_at ON answers(created_at);
CREATE INDEX idx_answer_votes_answerid ON answer_votes(answerid);
CREATE INDEX idx_answer_votes_userid ON answer_votes(userid);
CREATE INDEX idx_chat_messages_userid ON chat_messages(userId);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(createdAt);
CREATE INDEX idx_notifications_userid ON notifications(userid);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_user_sessions_userid ON user_sessions(userid);
CREATE INDEX idx_user_sessions_token ON user_sessions(token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Create views for common queries
CREATE VIEW question_stats AS
SELECT 
    q.questionid,
    q.title,
    q.userid,
    u.username,
    q.created_at,
    q.view_count,
    q.isResolved,
    COUNT(a.answerid) as answer_count,
    COALESCE(SUM(CASE WHEN av.vote_type = 'up' THEN 1 WHEN av.vote_type = 'down' THEN -1 ELSE 0 END), 0) as total_votes
FROM questions q
LEFT JOIN users u ON q.userid = u.userid
LEFT JOIN answers a ON q.questionid = a.questionid
LEFT JOIN answer_votes av ON a.answerid = av.answerid
GROUP BY q.questionid, q.title, q.userid, u.username, q.created_at, q.view_count, q.isResolved;

CREATE VIEW user_reputation AS
SELECT 
    u.userid,
    u.username,
    u.email,
    u.createdAt,
    COUNT(DISTINCT q.questionid) as questions_asked,
    COUNT(DISTINCT a.answerid) as answers_given,
    COUNT(DISTINCT CASE WHEN a.is_accepted = 1 THEN a.answerid END) as accepted_answers,
    u.reputation
FROM users u
LEFT JOIN questions q ON u.userid = q.userid
LEFT JOIN answers a ON u.userid = a.userid
GROUP BY u.userid, u.username, u.email, u.createdAt, u.reputation;

-- Create stored procedures for common operations
DELIMITER //

-- Procedure to update user reputation
CREATE PROCEDURE UpdateUserReputation(IN user_id INT)
BEGIN
    DECLARE question_count INT DEFAULT 0;
    DECLARE answer_count INT DEFAULT 0;
    DECLARE accepted_count INT DEFAULT 0;
    DECLARE vote_score INT DEFAULT 0;
    DECLARE new_reputation INT DEFAULT 0;
    
    -- Count user's questions
    SELECT COUNT(*) INTO question_count FROM questions WHERE userid = user_id;
    
    -- Count user's answers
    SELECT COUNT(*) INTO answer_count FROM answers WHERE userid = user_id;
    
    -- Count accepted answers
    SELECT COUNT(*) INTO accepted_count FROM answers WHERE userid = user_id AND is_accepted = 1;
    
    -- Calculate vote score from user's answers
    SELECT COALESCE(SUM(CASE WHEN av.vote_type = 'up' THEN 1 WHEN av.vote_type = 'down' THEN -1 ELSE 0 END), 0) 
    INTO vote_score 
    FROM answers a 
    LEFT JOIN answer_votes av ON a.answerid = av.answerid 
    WHERE a.userid = user_id;
    
    -- Calculate new reputation (questions: +1, answers: +2, accepted: +10, votes: +1 each)
    SET new_reputation = (question_count * 1) + (answer_count * 2) + (accepted_count * 10) + vote_score;
    
    -- Update user reputation
    UPDATE users SET reputation = new_reputation WHERE userid = user_id;
END //

-- Procedure to create notification
CREATE PROCEDURE CreateNotification(
    IN user_id INT,
    IN notif_type VARCHAR(20),
    IN notif_title VARCHAR(255),
    IN notif_message TEXT,
    IN question_id VARCHAR(255),
    IN answer_id VARCHAR(255)
)
BEGIN
    INSERT INTO notifications (userid, type, title, message, related_question_id, related_answer_id)
    VALUES (user_id, notif_type, notif_title, notif_message, question_id, answer_id);
END //

DELIMITER ;

-- Create triggers for automatic operations
DELIMITER //

-- Trigger to update reputation when answer is accepted
CREATE TRIGGER after_answer_accepted
AFTER UPDATE ON answers
FOR EACH ROW
BEGIN
    IF NEW.is_accepted = 1 AND OLD.is_accepted = 0 THEN
        CALL UpdateUserReputation(NEW.userid);
        
        -- Create notification for answer author
        CALL CreateNotification(
            NEW.userid,
            'accepted',
            'Your answer was accepted!',
            'Your answer to a question has been marked as accepted.',
            NEW.questionid,
            NEW.answerid
        );
    END IF;
END //

-- Trigger to create notification when new answer is posted
CREATE TRIGGER after_answer_created
AFTER INSERT ON answers
FOR EACH ROW
BEGIN
    -- Create notification for question owner
    DECLARE question_owner_id INT;
    SELECT userid INTO question_owner_id FROM questions WHERE questionid = NEW.questionid;
    
    CALL CreateNotification(
        question_owner_id,
        'answer',
        'New answer to your question',
        'Someone has answered your question.',
        NEW.questionid,
        NEW.answerid
    );
END //

DELIMITER ;

-- Sample data for testing (optional - remove in production)
INSERT IGNORE INTO users (username, email, password) VALUES
('admin', 'admin@evangadi.com', '$2b$10$example_hash'),
('testuser', 'test@evangadi.com', '$2b$10$example_hash'),
('developer', 'dev@evangadi.com', '$2b$10$example_hash');

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON evangadiforum.* TO 'Evangadi_Forum'@'localhost';
-- FLUSH PRIVILEGES;
