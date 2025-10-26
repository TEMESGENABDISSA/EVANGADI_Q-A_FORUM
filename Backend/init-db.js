const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  multipleStatements: true
};

async function initializeDatabase() {
  let connection;
  try {
    // Connect to MySQL without specifying a database first
    connection = await mysql.createConnection({
      ...dbConfig,
      database: 'mysql' // Connect to default mysql database
    });

    console.log('Connected to MySQL server');

    // Create the database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_DATABASE || 'evangadi_forum'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Database ${process.env.DB_DATABASE || 'evangadi_forum'} is ready`);

    // Switch to the database
    await connection.changeUser({ database: process.env.DB_DATABASE || 'evangadi_forum' });

    // Read and execute the schema file
    const schemaPath = path.join(__dirname, 'database_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the SQL file into individual statements and execute them
    const statements = schemaSQL.split(';').filter(statement => statement.trim() !== '');
    
    for (const statement of statements) {
      if (statement.trim() === '') continue;
      try {
        await connection.query(statement);
      } catch (err) {
        console.error('Error executing statement:', err);
        console.error('Statement:', statement);
        throw err;
      }
    }

    console.log('Database schema initialized successfully');
    
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

initializeDatabase()
  .then(() => {
    console.log('Database setup completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Database setup failed:', error);
    process.exit(1);
  });
