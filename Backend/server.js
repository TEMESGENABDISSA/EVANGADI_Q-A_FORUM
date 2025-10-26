require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/dbConfig');
const { pool } = db;

// Initialize express app
const app = express();
const net = require('net');

// Function to check if a port is available
const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => {
        server.close();
        resolve(true);
      })
      .listen(port);
  });
};

// Function to get the next available port
const getAvailablePort = async (startPort) => {
  let port = startPort;
  while (!(await isPortAvailable(port))) {
    port++;
    // Safety check to prevent infinite loop
    if (port > startPort + 100) {
      throw new Error('Could not find an available port');
    }
  }
  return port;
};

// Get the port from environment or use 5001 as default
const startPort = parseInt(process.env.PORT) || 5001;
let port = startPort;

// Set environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:5000'
];

// CORS middleware with credentials support
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow requests with no origin (like mobile apps or curl requests)
  if (process.env.NODE_ENV === 'development' || !origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Security headers middleware
app.use((req, res, next) => {
  // Set Content Security Policy
  if (process.env.NODE_ENV === 'development') {
    // Development CSP (more permissive)
    const nonce = require('crypto').randomBytes(16).toString('base64');
    const csp = [
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;",
      "connect-src 'self' http://localhost:* https://*.aivencloud.com wss: http: https: chrome-extension:;",
      "img-src 'self' data: blob: https:;",
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' 'nonce-${nonce}' 'strict-dynamic' https: http: chrome-extension: 'sha256-kPx0AsF0oz2kKiZ875xSvv693TBHkQ/0SkMJZnnNpnQ=';`,
      "script-src-attr 'unsafe-inline' 'self';",
      "style-src 'self' 'unsafe-inline' https: chrome-extension: data:;",
      "frame-src 'self' https:;",
      "child-src 'self' blob:;",
      "worker-src 'self' blob:;",
      "font-src 'self' https: data:;",
      "connect-src 'self' http://localhost:* https: http: ws: wss: chrome-extension:;"
    ].join(' ');
    
    res.setHeader('Content-Security-Policy', csp);
  } else {
    // Production CSP (more restrictive but still allowing necessary functionality)
    const nonce = require('crypto').randomBytes(16).toString('base64');
    const csp = [
      "default-src 'self';",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https: http: chrome-extension: 'sha256-kPx0AsF0oz2kKiZ875xSvv693TBHkQ/0SkMJZnnNpnQ=';`,
      `script-src-elem 'self' 'unsafe-inline' https: http:;`,
      "script-src-attr 'unsafe-inline' 'self';",
      "style-src 'self' 'unsafe-inline' https: chrome-extension: data:;",
      "img-src 'self' data: blob: https:;",
      "font-src 'self' https: data:;",
      "connect-src 'self' https: http://localhost:* ws: wss: chrome-extension:;",
      "frame-src 'self' https:;"
    ].join(' ');
    
    res.setHeader('Content-Security-Policy', csp);
  }
  
  // Other security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
});

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// DB connection
const dbConnection = require("./config/dbConfig");

// Import routes
const userRoutes = require("./routes/userRoutes");
const questionRoutes = require("./routes/questionRoute");
const answerRoutes = require("./routes/answerRoute");

// Use routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1", questionRoutes);
app.use("/api/v1", answerRoutes);

// Process error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Chat routes (legacy)
// const chatRoutes = require("./routes/chatRoute");
// app.use("/api/v1", chatRoutes);

// AI Assistant routes (testing)
const testAssistantRoutes = require("./routes/assistantRoute.new");
app.use("/api/v1/assistant", testAssistantRoutes);

// Notification routes
const notificationRoutes = require("./routes/notificationRoute");
app.use("/api/v1", notificationRoutes);

// Chatbot routes
const chatbotRoutes = require("./routes/chatbotRoute");
app.use("/api/chat", chatbotRoutes);

// --------------------
// TEST ROOT
// --------------------
app.get("/", (req, res) => {
  res.status(200).send("this is  Evangadi forum");
});

// Start server with database connection check
const start = async () => {
  try {
    // Test database connection
    const isDbConnected = await db.testConnection();
    if (!isDbConnected) {
      console.error('❌ Server cannot start without database connection');
      process.exit(1);
    }

    // Find an available port
    port = await getAvailablePort(port);
    const isOriginalPort = port === startPort;
    
    // Start the server
    const server = app.listen(port, () => {
      if (!isOriginalPort) {
        console.log(`\n⚠️  Port ${startPort} was in use, using port ${port} instead`);
      }
      console.log(`\n🚀 Server running at http://localhost:${port}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
      console.log(`🕒 ${new Date().toLocaleString()}\n`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use`);
      } else {
        console.error('❌ Server error:', error.message);
      }
      process.exit(1);
    });

    // Handle process termination
    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
      server.close(() => {
        console.log('💤 Server stopped');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Fatal error during server startup:', error.message);
    process.exit(1);
  }
};

start();
