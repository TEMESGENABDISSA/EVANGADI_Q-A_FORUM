const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_DATABASE || 'evangadi_forum',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 30000,
  charset: 'utf8mb4_unicode_ci',
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false }
    : undefined
};

const pool = mysql.createPool(dbConfig);

const testConnection = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.ping();
    console.log('✅ Database connected');
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

// Handle cleanup
const cleanup = async () => {
  console.log('\nClosing database connections...');
  try {
    await pool.end();
    console.log('✅ Database connections closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error closing database connections:', err);
    process.exit(1);
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
