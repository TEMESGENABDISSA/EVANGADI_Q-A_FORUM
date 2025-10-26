require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.cyan);
  console.log('='.repeat(60));
}

async function verifyEnvironmentVariables() {
  section('1. VERIFYING ENVIRONMENT VARIABLES');
  
  const requiredVars = [
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASS',
    'DB_DATABASE',
    'JWT_SECRET'
  ];
  
  const optionalVars = [
    'SSL_CA',
    'DB_CONNECTION_LIMIT',
    'PORT',
    'NODE_ENV'
  ];
  
  let allPresent = true;
  
  log('\n✓ Required variables:', colors.blue);
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      const displayValue = varName.includes('PASS') || varName.includes('SECRET')
        ? '***' 
        : process.env[varName];
      log(`  ✓ ${varName}: ${displayValue}`, colors.green);
    } else {
      log(`  ✗ ${varName}: MISSING`, colors.red);
      allPresent = false;
    }
  });
  
  log('\n✓ Optional variables:', colors.blue);
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      let displayValue = process.env[varName];
      if (varName === 'SSL_CA' && displayValue.includes('BEGIN CERTIFICATE')) {
        displayValue = '[SSL Certificate Present]';
      }
      log(`  ✓ ${varName}: ${displayValue}`, colors.green);
    } else {
      log(`  - ${varName}: Not set`, colors.yellow);
    }
  });
  
  return allPresent;
}

async function verifySSLCertificate() {
  section('2. VERIFYING SSL CERTIFICATE');
  
  // Check environment variable
  if (process.env.SSL_CA) {
    if (process.env.SSL_CA.includes('BEGIN CERTIFICATE')) {
      log('✓ SSL_CA contains certificate content', colors.green);
      return true;
    } else {
      log('✓ SSL_CA is set as file path: ' + process.env.SSL_CA, colors.green);
      if (fs.existsSync(process.env.SSL_CA)) {
        log('✓ Certificate file exists', colors.green);
        return true;
      } else {
        log('✗ Certificate file not found', colors.red);
        return false;
      }
    }
  }
  
  // Check default location
  const defaultCertPath = path.join(__dirname, 'config', 'ca-certificate.crt');
  if (fs.existsSync(defaultCertPath)) {
    log('✓ Certificate found at default location: ' + defaultCertPath, colors.green);
    const content = fs.readFileSync(defaultCertPath, 'utf8');
    if (content.includes('BEGIN CERTIFICATE')) {
      log('✓ Certificate content is valid', colors.green);
      return true;
    }
  }
  
  log('⚠ No SSL certificate configured', colors.yellow);
  return false;
}

async function testDatabaseConnection() {
  section('3. TESTING DATABASE CONNECTION');
  
  // Read SSL certificate
  let sslConfig = undefined;
  if (process.env.SSL_CA) {
    if (process.env.SSL_CA.includes('BEGIN CERTIFICATE')) {
      sslConfig = {
        ca: process.env.SSL_CA,
        rejectUnauthorized: false
      };
    } else if (fs.existsSync(process.env.SSL_CA)) {
      sslConfig = {
        ca: fs.readFileSync(process.env.SSL_CA),
        rejectUnauthorized: false
      };
    }
  } else {
    const defaultCertPath = path.join(__dirname, 'config', 'ca-certificate.crt');
    if (fs.existsSync(defaultCertPath)) {
      sslConfig = {
        ca: fs.readFileSync(defaultCertPath),
        rejectUnauthorized: false
      };
    }
  }
  
  const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
    connectTimeout: 30000,
    ssl: sslConfig
  };
  
  log('\nConnection details:', colors.blue);
  log(`  Host: ${dbConfig.host}`, colors.reset);
  log(`  Port: ${dbConfig.port}`, colors.reset);
  log(`  User: ${dbConfig.user}`, colors.reset);
  log(`  Database: ${dbConfig.database}`, colors.reset);
  log(`  SSL: ${sslConfig ? 'Enabled' : 'Disabled'}`, colors.reset);
  
  try {
    log('\nAttempting connection...', colors.yellow);
    const connection = await mysql.createConnection(dbConfig);
    log('✓ Connection established successfully!', colors.green);
    
    // Test query
    const [rows] = await connection.query('SELECT 1 as test, NOW() as server_time');
    log(`✓ Test query successful: ${JSON.stringify(rows[0])}`, colors.green);
    
    await connection.end();
    return true;
  } catch (error) {
    log('✗ Connection failed:', colors.red);
    log(`  Error: ${error.message}`, colors.red);
    log(`  Code: ${error.code}`, colors.red);
    if (error.errno) log(`  Errno: ${error.errno}`, colors.red);
    
    // Provide troubleshooting tips
    if (error.code === 'ETIMEDOUT') {
      log('\n💡 Troubleshooting tips:', colors.yellow);
      log('  - Check if the database host and port are correct', colors.yellow);
      log('  - Verify your network/firewall allows connections to this host', colors.yellow);
      log('  - Ensure the database service is running', colors.yellow);
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      log('\n💡 Troubleshooting tips:', colors.yellow);
      log('  - Verify your username and password are correct', colors.yellow);
      log('  - Check if the user has proper permissions', colors.yellow);
    } else if (error.code === 'ENOTFOUND') {
      log('\n💡 Troubleshooting tips:', colors.yellow);
      log('  - Check if the hostname is correct', colors.yellow);
      log('  - Verify your internet connection', colors.yellow);
    }
    
    return null;
  }
}

async function verifyDatabaseSchema(connectionSuccessful) {
  section('4. VERIFYING DATABASE SCHEMA');
  
  if (!connectionSuccessful) {
    log('⚠ Skipping schema verification (no connection)', colors.yellow);
    return false;
  }
  
  try {
    // Re-establish connection for this test
    let sslConfig = undefined;
    if (process.env.SSL_CA) {
      if (process.env.SSL_CA.includes('BEGIN CERTIFICATE')) {
        sslConfig = { ca: process.env.SSL_CA, rejectUnauthorized: false };
      } else if (fs.existsSync(process.env.SSL_CA)) {
        sslConfig = { ca: fs.readFileSync(process.env.SSL_CA), rejectUnauthorized: false };
      }
    } else {
      const defaultCertPath = path.join(__dirname, 'config', 'ca-certificate.crt');
      if (fs.existsSync(defaultCertPath)) {
        sslConfig = { ca: fs.readFileSync(defaultCertPath), rejectUnauthorized: false };
      }
    }
    
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_DATABASE,
      connectTimeout: 30000,
      ssl: sslConfig
    });
    
    const requiredTables = [
      'users',
      'questions',
      'answers',
      'answer_votes',
      'notifications'
    ];
    
    log('\nChecking required tables:', colors.blue);
    let allTablesExist = true;
    
    for (const table of requiredTables) {
      try {
        const [rows] = await conn.query(`SHOW TABLES LIKE '${table}'`);
        if (rows.length > 0) {
          log(`  ✓ Table '${table}' exists`, colors.green);
        } else {
          log(`  ✗ Table '${table}' missing`, colors.red);
          allTablesExist = false;
        }
      } catch (err) {
        log(`  ✗ Error checking table '${table}': ${err.message}`, colors.red);
        allTablesExist = false;
      }
    }
    
    await conn.end();
    return allTablesExist;
  } catch (error) {
    log(`✗ Schema verification failed: ${error.message}`, colors.red);
    return false;
  }
}

async function verifyBackendRoutes() {
  section('5. VERIFYING BACKEND ROUTES');
  
  const routes = [
    { path: './routes/userRoutes.js', name: 'User Routes' },
    { path: './routes/questionRoute.js', name: 'Question Routes' },
    { path: './routes/answerRoute.js', name: 'Answer Routes' },
    { path: './routes/chatbotRoute.js', name: 'Chatbot Routes' },
    { path: './routes/notificationRoute.js', name: 'Notification Routes' }
  ];
  
  let allExist = true;
  
  routes.forEach(route => {
    const fullPath = path.join(__dirname, route.path);
    if (fs.existsSync(fullPath)) {
      log(`  ✓ ${route.name}: ${route.path}`, colors.green);
    } else {
      log(`  ✗ ${route.name}: MISSING`, colors.red);
      allExist = false;
    }
  });
  
  return allExist;
}

async function verifyControllers() {
  section('6. VERIFYING CONTROLLERS');
  
  const controllers = [
    { path: './controller/usercontroller.js', name: 'User Controller' },
    { path: './controller/questionController.js', name: 'Question Controller' },
    { path: './controller/answerController.js', name: 'Answer Controller' },
    { path: './controller/chatbotController.js', name: 'Chatbot Controller' },
    { path: './controller/notificationController.js', name: 'Notification Controller' }
  ];
  
  let allExist = true;
  
  controllers.forEach(controller => {
    const fullPath = path.join(__dirname, controller.path);
    if (fs.existsSync(fullPath)) {
      log(`  ✓ ${controller.name}: ${controller.path}`, colors.green);
    } else {
      log(`  ✗ ${controller.name}: MISSING`, colors.red);
      allExist = false;
    }
  });
  
  return allExist;
}

async function verifyMiddleware() {
  section('7. VERIFYING MIDDLEWARE');
  
  const middleware = [
    { path: './middleware/authMiddleware.js', name: 'Auth Middleware' }
  ];
  
  let allExist = true;
  
  middleware.forEach(mw => {
    const fullPath = path.join(__dirname, mw.path);
    if (fs.existsSync(fullPath)) {
      log(`  ✓ ${mw.name}: ${mw.path}`, colors.green);
    } else {
      log(`  ✗ ${mw.name}: MISSING`, colors.red);
      allExist = false;
    }
  });
  
  return allExist;
}

async function generateSummary(results) {
  section('VERIFICATION SUMMARY');
  
  const checks = [
    { name: 'Environment Variables', status: results.envVars },
    { name: 'SSL Certificate', status: results.sslCert },
    { name: 'Database Connection', status: results.dbConnection === true },
    { name: 'Database Schema', status: results.dbSchema },
    { name: 'Backend Routes', status: results.routes },
    { name: 'Controllers', status: results.controllers },
    { name: 'Middleware', status: results.middleware }
  ];
  
  const passed = checks.filter(c => c.status).length;
  const total = checks.length;
  
  checks.forEach(check => {
    const symbol = check.status ? '✓' : '✗';
    const color = check.status ? colors.green : colors.red;
    log(`  ${symbol} ${check.name}`, color);
  });
  
  console.log('\n' + '='.repeat(60));
  if (passed === total) {
    log(`✓ ALL CHECKS PASSED (${passed}/${total})`, colors.green);
    log('\n🎉 Your system is ready to use!', colors.green);
  } else {
    log(`⚠ SOME CHECKS FAILED (${passed}/${total} passed)`, colors.yellow);
    log('\n⚠️  Please fix the issues above before proceeding.', colors.yellow);
  }
  console.log('='.repeat(60) + '\n');
}

async function main() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════╗', colors.magenta);
  log('║     EVANGADI FORUM - SYSTEM VERIFICATION TOOL          ║', colors.magenta);
  log('╚════════════════════════════════════════════════════════╝', colors.magenta);
  
  const results = {
    envVars: false,
    sslCert: false,
    dbConnection: null,
    dbSchema: false,
    routes: false,
    controllers: false,
    middleware: false
  };
  
  try {
    results.envVars = await verifyEnvironmentVariables();
    results.sslCert = await verifySSLCertificate();
    results.dbConnection = await testDatabaseConnection();
    results.dbSchema = await verifyDatabaseSchema(results.dbConnection);
    results.routes = await verifyBackendRoutes();
    results.controllers = await verifyControllers();
    results.middleware = await verifyMiddleware();
    
    await generateSummary(results);
    
    process.exit(results.dbConnection && results.envVars ? 0 : 1);
  } catch (error) {
    log(`\n✗ Fatal error during verification: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

main();
