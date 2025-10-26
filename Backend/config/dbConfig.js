const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Read SSL certificate - prioritize file over environment variable
let sslConfig = undefined;

// First, try to load from default location (most reliable)
const defaultCertPath = path.join(__dirname, 'ca-certificate.crt');
if (fs.existsSync(defaultCertPath)) {
  try {
    sslConfig = {
      ca: fs.readFileSync(defaultCertPath, 'utf8'),
      rejectUnauthorized: false
    };
    console.log('✅ Loaded SSL certificate from file:', defaultCertPath);
  } catch (err) {
    console.error('❌ Error reading SSL certificate file:', err.message);
  }
}

// Fallback to environment variable if file doesn't exist
if (!sslConfig && process.env.SSL_CA) {
  // If SSL_CA is a file path
  if (!process.env.SSL_CA.includes('BEGIN CERTIFICATE')) {
    try {
      const certPath = path.resolve(process.env.SSL_CA);
      if (fs.existsSync(certPath)) {
        sslConfig = {
          ca: fs.readFileSync(certPath, 'utf8'),
          rejectUnauthorized: false
        };
        console.log('✅ Loaded SSL certificate from path:', certPath);
      }
    } catch (err) {
      console.warn('⚠️  SSL certificate file not found:', err.message);
    }
  } 
  // If SSL_CA contains the certificate content directly
  else {
    // Handle potential escape sequences in certificate
    let certContent = process.env.SSL_CA;
    // Replace literal \n with actual newlines if they exist
    if (certContent.includes('\\n')) {
      certContent = certContent.replace(/\\n/g, '\n');
    }
    sslConfig = {
      ca: certContent,
      rejectUnauthorized: false
    };
    console.log('✅ Loaded SSL certificate from environment variable');
  }
}

// Database configuration with defaults
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_DATABASE || 'evangadi_forum',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  connectTimeout: 30000, // 30 seconds for cloud databases
  charset: 'utf8mb4_unicode_ci',
  ssl: sslConfig,
  // Enable multiple statements if needed (be careful with this in production)
  multipleStatements: false
};

// Create the connection pool with promise support
const pool = mysql.createPool(dbConfig);

// Test the connection with detailed error handling
const testConnection = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT 1 as test');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Connection details:', {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database,
      ssl: dbConfig.ssl ? 'configured' : 'not configured',
      errorCode: error.code,
      errorNo: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
    if (error.code === 'ETIMEDOUT' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('💡 Troubleshooting: The connection to the database server timed out or was lost.');
      console.error('   - Check if the database host and port are correct');
      console.error('   - Verify your network connection to the database server');
      console.error('   - Check if the database server is running and accessible');
      console.error('   - If using a cloud database, check the service status');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Troubleshooting: Access denied for user.');
      console.error('   - Verify your database username and password');
      console.error('   - Check if the user has proper permissions');
      console.error('   - If you recently changed the password, update it in the .env file');
    } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
      console.error('\n💡 Troubleshooting: Could not resolve the database hostname.');
      console.error('   - Check if the database hostname is correct');
      console.error('   - Verify your internet connection');
      console.error('   - Try pinging the host to check connectivity');
    } else if (error.code === 'HANDSHAKE_SSL_ERROR') {
      console.error('\n💡 Troubleshooting: SSL handshake failed.');
      console.error('   - Check if the SSL certificate is valid');
      console.error('   - Make sure your system time is correct');
      console.error('   - Try disabling SSL if not required (not recommended for production)');
    } else {
      console.error('\n💡 Additional troubleshooting:');
      console.error('   - Check if the database exists and is accessible');
      console.error('   - Verify the database user has proper permissions');
      console.error('   - Check Aiven Console for any service issues or maintenance');
    }
    
    return false;
  } finally {
    if (connection) await connection.release();
  }
};

// Set character set
pool.query("SET NAMES utf8mb4").catch(console.error);

// Test the connection on startup
testConnection().then(connected => {
  if (!connected) {
    console.error('❌ Failed to connect to the database. Please check your database configuration.');
    process.exit(1);
  } else {
    console.log('✅ Database connection is ready');
  }
});

// Handle process termination
const cleanup = async () => {
  console.log('\nClosing database connections...');
  try {
    await pool.end();
    console.log('✅ Database connections closed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error closing database connections:', err);
    process.exit(1);
  }
};

// Handle different types of process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  cleanup();
});

// Export the pool and testConnection for use in other files
module.exports = {
    pool,
    testConnection
};
