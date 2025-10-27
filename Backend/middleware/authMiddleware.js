const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "No token provided or invalid format" });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;

    const decoded = jwt.verify(token, secret);

    req.user = {
      username: decoded.username,
      userid: decoded.userid,
    };

    next();
  } catch (error) {
    console.error("JWT Error:", error.message);
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Invalid or expired authentication token" });
  }
}

module.exports = authMiddleware;
