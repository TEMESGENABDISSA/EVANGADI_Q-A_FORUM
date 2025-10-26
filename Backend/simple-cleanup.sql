-- Clean up test notifications and test data
-- Run this in your MySQL client or phpMyAdmin

-- 1. Delete test notifications
DELETE FROM notifications 
WHERE userid IN (
  SELECT userid FROM users 
  WHERE username LIKE '%test%' 
  OR username LIKE '%asker%' 
  OR username LIKE '%answerer%'
);

-- 2. Delete test answers
DELETE FROM answers 
WHERE userid IN (
  SELECT userid FROM users 
  WHERE username LIKE '%test%' 
  OR username LIKE '%asker%' 
  OR username LIKE '%answerer%'
);

-- 3. Delete test questions
DELETE FROM questions 
WHERE userid IN (
  SELECT userid FROM users 
  WHERE username LIKE '%test%' 
  OR username LIKE '%asker%' 
  OR username LIKE '%answerer%'
);

-- 4. Delete test users
DELETE FROM users 
WHERE username LIKE '%test%' 
OR username LIKE '%asker%' 
OR username LIKE '%answerer%';

-- 5. Verify cleanup
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Questions', COUNT(*) FROM questions
UNION ALL
SELECT 'Answers', COUNT(*) FROM answers
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications;
