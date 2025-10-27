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
  
  // In development, allow all origins for easier development
  if (process.env.NODE_ENV === 'development') {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    return next();
  }
  
  // In production, only allow specific origins
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  }
  
  next();
});

// Security headers middleware - Simplified for development
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    // Development - More permissive settings
    res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http: https: ws: wss:;");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  } else {
    // Production - More secure settings
    const nonce = require('crypto').randomBytes(16).toString('base64');
    const csp = [
      "default-src 'self';",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https: http:;`,
      "style-src 'self' 'unsafe-inline' https:;",
      "img-src 'self' data: blob: https:;",
      "font-src 'self' https: data:;",
      "connect-src 'self' https: wss:;",
      "frame-src 'self' https:;"
    ].join(' ');
    
    res.setHeader('Content-Security-Policy', csp);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  }
  
  next();
});

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// DB connection
const dbConnection = require("./config/dbConfig");

// Error handling wrapper for async route handlers
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Import routes
const userRoutes = require("./routes/userRoutes");
const questionRoutes = require("./routes/questionRoute");
const answerRoutes = require("./routes/answerRoute");

// Use routes with error handling
app.use("/api/v1/user", asyncHandler(userRoutes));
app.use("/api/v1", asyncHandler(questionRoutes));
app.use("/api/v1", asyncHandler(answerRoutes));

// AI Assistant routes (testing)
const testAssistantRoutes = require("./routes/assistantRoute.new");
app.use("/api/v1/assistant", asyncHandler(testAssistantRoutes));

// Notification routes
const notificationRoutes = require("./routes/notificationRoute");
app.use("/api/v1", asyncHandler(notificationRoutes));

// Chatbot routes
const chatbotRoutes = require("./routes/chatbotRoute");
app.use("/api/v1/chat", asyncHandler(chatbotRoutes));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// --------------------
// TEST ROOT
// --------------------
app.get("/", (req, res) => {
  res.status(200).send("this is  Evangadi forum");
});

// --------------------
// TEST EMAIL ENDPOINT
// --------------------
app.get("/test-email", async (req, res) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(400).json({ 
        error: "Email configuration not set",
        EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Not set',
        EMAIL_PASS: process.env.EMAIL_PASS ? 'Set' : 'Not set'
      });
    }

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      },
    });

    // Verify transporter
    await transporter.verify();
    
    res.json({ 
      success: true, 
      message: "Email configuration is working",
      email_user: process.env.EMAIL_USER
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Email configuration failed", 
      details: error.message 
    });
  }
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
