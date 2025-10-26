const mysql2 = require("mysql2");
const dotenv = require("dotenv");
dotenv.config();

const dbConnection = mysql2.createPool({
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASS,
  connectionLimit:
    process.env.CONNECTION_LIMIT || process.env.DB_CONNECTION_LIMIT,
  host: process.env.DB_HOST,
  charset: "utf8mb4_general_ci",
});

const pool = dbConnection.promise();

// Ensure connection/session uses utf8mb4 for emoji support
pool.query("SET NAMES utf8mb4").catch(() => {});

module.exports = pool;
