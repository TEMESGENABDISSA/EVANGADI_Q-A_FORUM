const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
require('dotenv').config();

async function initializeDatabase() {
  // Read the fixed schema file
  const schemaPath = path.join(__dirname, 'database_schema_fixed.sql');
  const schemaSQL = await fs.readFile(schemaPath, 'utf8');

  // Read SSL certificate if available
  let sslConfig = undefined;
  if (process.env.SSL_CA) {
    // If SSL_CA contains the certificate content directly
    if (process.env.SSL_CA.includes('BEGIN CERTIFICATE')) {
      sslConfig = {
        ca: process.env.SSL_CA,
        rejectUnauthorized: false
      };
    } 
    // If SSL_CA is a file path
    else {
      try {
        const certPath = path.resolve(process.env.SSL_CA);
        if (fsSync.existsSync(certPath)) {
          sslConfig = {
            ca: fsSync.readFileSync(certPath),
            rejectUnauthorized: false
          };
        }
      } catch (err) {
        console.warn('⚠️  SSL certificate file not found, attempting connection without SSL');
      }
    }
  } else {
    // Try to load from default location
    const defaultCertPath = path.join(__dirname, 'config', 'ca-certificate.crt');
    if (fsSync.existsSync(defaultCertPath)) {
      sslConfig = {
        ca: fsSync.readFileSync(defaultCertPath),
        rejectUnauthorized: false
      };
      console.log('✅ Loaded SSL certificate from default location');
    }
  }

  // Create a connection to MySQL
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
    multipleStatements: true,
    connectTimeout: 30000,
    ssl: sslConfig
  });

  try {
    console.log('🚀 Starting database reinitialization with fixed schema...');
    
    // First, drop all tables if they exist (in correct order to avoid FK constraints)
    console.log('Dropping existing tables...');
    await connection.query(`
      SET FOREIGN_KEY_CHECKS = 0;
      DROP TABLE IF EXISTS answer_votes;
      DROP TABLE IF EXISTS chat_messages;
      DROP TABLE IF EXISTS question_tags;
      DROP TABLE IF EXISTS user_sessions;
      DROP TABLE IF EXISTS notifications;
      DROP TABLE IF EXISTS answers;
      DROP TABLE IF EXISTS questions;
      DROP TABLE IF EXISTS tags;
      DROP TABLE IF EXISTS users;
      DROP VIEW IF EXISTS question_stats;
      DROP VIEW IF EXISTS user_reputation;
      SET FOREIGN_KEY_CHECKS = 1;
    `);
    console.log('✅ All tables dropped');

    // Split SQL into individual statements, handling multi-line CREATE VIEW
    const lines = schemaSQL.split('\n');
    const statements = [];
    let currentStatement = '';
    let inView = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip comments and empty lines when not building a statement
      if (!currentStatement && (trimmedLine === '' || trimmedLine.startsWith('--'))) {
        continue;
      }
      
      // Check if we're starting a view
      if (trimmedLine.toUpperCase().startsWith('CREATE OR REPLACE VIEW') || 
          trimmedLine.toUpperCase().startsWith('CREATE VIEW')) {
        inView = true;
      }
      
      currentStatement += line + '\n';
      
      // End of statement
      if (trimmedLine.endsWith(';')) {
        if (currentStatement.trim()) {
          statements.push(currentStatement.trim());
        }
        currentStatement = '';
        inView = false;
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;
      
      try {
        const preview = statement.split('\n')[0].substring(0, 80);
        console.log(`[${i+1}/${statements.length}] ${preview}...`);
        await connection.query(statement);
      } catch (error) {
        console.error(`❌ Error executing statement ${i+1}:`, error.message);
        console.error(`Statement preview: ${statement.substring(0, 200)}`);
        throw error;
      }
    }
    
    console.log('\n✅ Database reinitialized successfully with fixed schema!');
    console.log('\n📋 Tables created:');
    console.log('  - users (with user_id, password_hash, full_name, last_login)');
    console.log('  - questions');
    console.log('  - answers');
    console.log('  - answer_votes');
    console.log('  - chat_messages');
    console.log('  - notifications');
    console.log('  - tags');
    console.log('  - question_tags');
    console.log('  - user_sessions');
    console.log('\n✨ Schema now matches controller expectations!');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
    console.log('Database connection closed.');
  }
}

// Run the initialization
initializeDatabase().catch(console.error);
