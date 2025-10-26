const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Helper function to split SQL into executable chunks
function splitSQLStatements(sql) {
  const statements = [];
  let currentStatement = '';
  let inProcedure = false;
  let inView = false;
  
  const lines = sql.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines and comments at the beginning of the file
    if ((!currentStatement && !inProcedure && !inView) && 
        (trimmedLine === '' || trimmedLine.startsWith('--'))) {
      continue;
    }
    
    // Check if we're starting a procedure or view
    if (!inProcedure && !inView && 
        (trimmedLine.toUpperCase().startsWith('DELIMITER //') || 
         trimmedLine.toUpperCase().startsWith('CREATE PROCEDURE') ||
         trimmedLine.toUpperCase().startsWith('CREATE TRIGGER') ||
         trimmedLine.toUpperCase().startsWith('CREATE FUNCTION'))) {
      inProcedure = true;
      currentStatement = '';
    } else if (!inProcedure && !inView && trimmedLine.toUpperCase().startsWith('CREATE VIEW')) {
      inView = true;
      currentStatement = '';
    }
    
    // Add the current line to the current statement
    currentStatement += line + '\n';
    
    // Check if we're ending a procedure or view
    if (inProcedure && trimmedLine === 'END//') {
      inProcedure = false;
      statements.push(currentStatement);
      currentStatement = '';
    } else if (inView && trimmedLine.endsWith(';')) {
      inView = false;
      statements.push(currentStatement);
      currentStatement = '';
    } else if (!inProcedure && !inView && trimmedLine.endsWith(';')) {
      // Regular SQL statement ending with semicolon
      statements.push(currentStatement);
      currentStatement = '';
    }
  }
  
  // Add any remaining statement
  if (currentStatement.trim() !== '') {
    statements.push(currentStatement);
  }
  
  return statements;
}

async function initializeDatabase() {
  // Read the schema file
  const schemaPath = path.join(__dirname, 'database_schema.sql');
  const schemaSQL = await fs.readFile(schemaPath, 'utf8');

  // Create a connection to MySQL
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
    multipleStatements: true,
    ssl: {
      ca: process.env.SSL_CA,
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🚀 Starting database initialization...');
    
    // First, drop all tables if they exist
    console.log('Dropping existing tables...');
    await connection.query(`
      SET FOREIGN_KEY_CHECKS = 0;
      DROP TABLE IF EXISTS answer_votes;
      DROP TABLE IF EXISTS chat_messages;
      DROP TABLE IF EXISTS answers;
      DROP TABLE IF EXISTS questions;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS tags;
      DROP TABLE IF EXISTS notifications;
      DROP TABLE IF EXISTS question_tags;
      DROP TABLE IF EXISTS user_followers;
      DROP TABLE IF EXISTS question_votes;
      SET FOREIGN_KEY_CHECKS = 1;
    `);

    // Split SQL into executable statements
    const statements = splitSQLStatements(schemaSQL);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;
      
      // Skip DELIMITER commands as they're not needed with mysql2
      if (statement.toUpperCase().startsWith('DELIMITER')) {
        continue;
      }
      
      try {
        // Log a preview of the statement
        const preview = statement.split('\n')[0].substring(0, 100);
        console.log(`[${i+1}/${statements.length}] Executing: ${preview}...`);
        
        // Execute the statement
        await connection.query(statement);
        
      } catch (error) {
        // Handle specific errors
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`  ✓ Index already exists, skipping`);
          continue;
        } else if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`  ✓ Table already exists, skipping`);
          continue;
        } else if (error.code === 'ER_DUP_ENTRY') {
          console.log(`  ✓ Duplicate entry, skipping`);
          continue;
        } else if (error.code === 'ER_NO_SUCH_TABLE') {
          console.log(`  ✓ Table doesn't exist yet, will be created later`);
          continue;
        }
        
        console.error(`❌ Error executing statement: ${error.message}`);
        if (error.sql) {
          console.error(`Failed SQL: ${error.sql.substring(0, 200)}...`);
        }
        throw error;
      }
    }
    
    console.log('✅ Database initialized successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    if (error.sql) {
      console.error('Failed SQL:', error.sql);
    }
    process.exit(1);
  } finally {
    if (connection) await connection.end();
    console.log('Database connection closed.');
  }
}

// Run the initialization
initializeDatabase().catch(console.error);