require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Initialize express app
const app = express();
const port = process.env.PORT || 5001;

// Set environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// CORS configuration
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' 'inline-speculation-rules' 'strict-dynamic' https: http:; " +
    "style-src 'self' 'unsafe-inline' https: http:; " +
    "img-src 'self' data: https: http:; " +
    "font-src 'self' https: http: data:; " +
    "connect-src 'self' http://localhost:5000 ws://localhost:5000 http://localhost:3000 http://localhost:5173 ws://localhost:5173 http://127.0.0.1:5173 ws:; " +
    "frame-ancestors 'self'; " +
    "form-action 'self'; " +
    "base-uri 'self'; " +
    "object-src 'none';"
  );
  
  // Additional headers for CORS
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  
  next();
});

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:5000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false,
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// DB connection
const dbConnection = require("./config/dbConfig");

// Process error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const userRoutes = require("./routes/userRoutes");
app.use("/api/v1/user", userRoutes);

const questionRoutes = require("./routes/questionRoute");
app.use("/api/v1", questionRoutes);

const answerRoutes = require("./routes/answerRoute");
app.use("/api/v1", answerRoutes);

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

//start server
async function start() {
  try {
    await dbConnection.execute("SELECT 'test'");
    console.log("Database connected successfully");
    await app.listen(port);
    console.log(`Server running at http://localhost:${port}`);
  } catch (err) {
    console.error(err.message);
  }
}

start();
