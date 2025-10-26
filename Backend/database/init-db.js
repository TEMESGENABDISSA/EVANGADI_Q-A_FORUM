// init-db.js
const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function initializeDatabase() {
  // Read the schema file
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSQL = await fs.readFile(schemaPath, 'utf8');

  // Create a new pool with admin privileges
  const adminPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  const client = await adminPool.connect();
  
  try {
    console.log('🚀 Starting database initialization...');
    
    // Begin a transaction
    await client.query('BEGIN');
    
    // Execute the schema SQL
    await client.query(schemaSQL);
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('✅ Database initialized successfully!');
    
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    client.release();
    await adminPool.end();
  }
}

// Run the initialization
initializeDatabase().catch(console.error);
