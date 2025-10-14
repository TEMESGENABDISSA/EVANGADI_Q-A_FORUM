const express = require("express");
const router = express.Router();
const {
  register,
  login,
  check,
  forgotPassword,
  resetPassword,
} = require("../controller/usercontroller.js");
const authMiddleware = require("../middleware/authMiddleware.js");

// Auth routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgotPassword", forgotPassword);
router.post("/resetPassword/:token", resetPassword);
router.get("/check", authMiddleware, check);

module.exports = router;
