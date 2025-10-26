const { createConnection } = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function initializeDatabase() {
  // Read the schema file
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSQL = await fs.readFile(schemaPath, 'utf8');

  // Create a connection without database first
  const connection = await createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    multipleStatements: true,
    ssl: process.env.SSL_CA ? {
      ca: process.env.SSL_CA,
      rejectUnauthorized: false
    } : undefined
  });

  const dbName = process.env.DB_DATABASE || 'evangadi_forum';

  try {
    console.log('🚀 Starting database initialization...');
    
    // Drop and recreate the database
    console.log(`Dropping and recreating database: ${dbName}`);
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    await connection.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${dbName}\``);
    
    // Enable UUID extension if using PostgreSQL
    try {
      await connection.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    } catch (e) {
      console.log('Note: uuid-ossp extension might not be needed or already exists');
    }

    // Split SQL by semicolon and filter out empty statements and comments
    const statements = schemaSQL
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith('--'));

    // Execute all statements in order
    for (const statement of statements) {
      if (statement) {
        try {
          console.log(`Executing: ${statement.substring(0, 100).replace(/\s+/g, ' ').trim()}...`);
          await connection.query(statement);
        } catch (error) {
          console.error(`Error executing statement: ${error.message}`);
          console.error(`Statement: ${statement.substring(0, 200)}...`);
          throw error;
        }
      }
    }

    console.log('✅ Database initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

// Run the initialization
initializeDatabase().catch(console.error);
