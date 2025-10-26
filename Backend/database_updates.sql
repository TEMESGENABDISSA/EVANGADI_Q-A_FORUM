-- Database Schema Updates for Evangadi Forum

-- 1. Create answer_votes table for voting system
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

-- 2. Add view_count column to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;

-- 3. Add is_accepted column to answers table
ALTER TABLE answers ADD COLUMN IF NOT EXISTS is_accepted TINYINT(1) DEFAULT 0;

-- 4. Add tag column to questions table if it doesn't exist
ALTER TABLE questions ADD COLUMN IF NOT EXISTS tag VARCHAR(100) DEFAULT 'General';

-- Show the updated table structures
DESCRIBE questions;
DESCRIBE answers;
DESCRIBE answer_votes;
