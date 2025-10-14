const dbConnection = require("../config/dbConfig");
const bcrypt = require("bcrypt");
const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config();

async function register(req, res) {
  const { username, firstname, lastname, email, password } = req.body;
  if (!username || !firstname || !lastname || !email || !password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Please provide all required fields." });
  }

  if (password.length < 8) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Password should be at least 8 characters long." });
  }

  try {
    const [user] = await dbConnection.query(
      "SELECT username, userid FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (user.length > 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Username or Email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const timestamp = new Date();
    timestamp.setHours(timestamp.getHours() + 3);
    const formattedTimestamp = timestamp
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    await dbConnection.query(
      "INSERT INTO users (username, firstname, lastname, email, password, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      [username, firstname, lastname, email, hashedPassword, formattedTimestamp]
    );

    res.status(StatusCodes.CREATED).json({ msg: "User created successfully." });
  } catch (err) {
    console.error(err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Internal server error." });
  }
}

async function login(req, res) {
  const { usernameOrEmail, password } = req.body;
  if (!usernameOrEmail || !password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Your email or password is incorrect." });
  }

  try {
    const [user] = await dbConnection.query(
      "SELECT username, userid, password FROM users WHERE email = ? OR username = ?",
      [usernameOrEmail, usernameOrEmail]
    );

    if (user.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Invalid credentials." });
    }

    const token = jwt.sign(
      { username: user[0].username, userid: user[0].userid },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res
      .status(StatusCodes.OK)
      .json({ msg: "User logged in successfully", token });
  } catch (err) {
    console.error(err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Internal server error." });
  }
}

function check(req, res) {
  const { username, userid } = req.user;
  res.status(StatusCodes.OK).json({ username, userid });
}

async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ msg: "Please provide an email address." });

  try {
    const [user] = await dbConnection.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (user.length === 0)
      return res.status(404).json({ msg: "No user found with that email." });

    const token = jwt.sign({ userid: user[0].userid }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const resetLink = `http://localhost:5173/reset-password/${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset",
      html: `<p>Click the link to reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
    });

    res
      .status(200)
      .json({ msg: "Password reset link has been sent to your email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Internal server error." });
  }
}

async function resetPassword(req, res) {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 8) {
    return res
      .status(400)
      .json({ msg: "Password is required and must be at least 8 characters." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userid = decoded.userid;
    const hashedPassword = await bcrypt.hash(password, 10);

    await dbConnection.query("UPDATE users SET password = ? WHERE userid = ?", [
      hashedPassword,
      userid,
    ]);
    res.status(200).json({ msg: "Password has been reset successfully." });
  } catch (err) {
    console.error(err);
    res.status(400).json({ msg: "Invalid or expired reset link." });
  }
}

module.exports = { register, login, check, forgotPassword, resetPassword };
