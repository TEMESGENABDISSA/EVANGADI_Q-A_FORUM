const { pool } = require("../config/dbConfig");
const bcrypt = require("bcrypt");
const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config();

// Register a new user
async function register(req, res) {
    const { username, email, password, full_name } = req.body;
    
    // If full_name is not provided, try to get it from firstname and lastname (for backward compatibility)
    const nameToUse = full_name || (req.body.firstname && req.body.lastname 
        ? `${req.body.firstname} ${req.body.lastname}` 
        : null);
        
    if (!username || !email || !password || !nameToUse) {
        return res.status(StatusCodes.BAD_REQUEST).json({ 
            success: false,
            message: "Please provide all required fields: username, email, password, and full_name (or firstname and lastname)." 
        });
    }

    if (password.length < 8) {
        return res.status(StatusCodes.BAD_REQUEST).json({ 
            success: false,
            message: "Password should be at least 8 characters long." 
        });
    }

    try {
        // Start a transaction
        await pool.query('START TRANSACTION');

        // Check if username or email already exists
        const [existingUsers] = await pool.query(
            `SELECT username, userid FROM users WHERE username = ? OR email = ?`,
            [username, email]
        );

        if (existingUsers && existingUsers.length > 0) {
            const existingUser = existingUsers[0];
            if (existingUser.username === username) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: "Username already exists. Please choose a different username."
                });
            } else {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: "Email is already registered. Please use a different email or login."
                });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert new user
        const [result] = await pool.query(
            `INSERT INTO users (username, email, password_hash, full_name) 
             VALUES (?, ?, ?, ?)`,
            [username, email, hashedPassword, nameToUse]
        );

        // Get the newly created user
        const [newUser] = await pool.query(
            `SELECT userid, username, email, full_name, createdAt 
             FROM users WHERE userid = ?`,
            [result.insertId]
        );

        await pool.query('COMMIT');

        res.status(StatusCodes.CREATED).json({
            success: true,
            message: "User registered successfully",
            user: newUser[0]
        });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Registration error:', err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "An error occurred during registration. Please try again.",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
}

// User login
async function login(req, res) {
    const { email, usernameOrEmail, password } = req.body;
    
    // Accept either 'email' or 'usernameOrEmail' field
    const loginIdentifier = email || usernameOrEmail;

    if (!loginIdentifier || !password) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Please provide both email/username and password.'
        });
    }

    try {
        // Find user by email OR username
        const [users] = await pool.query(
            'SELECT userid, username, email, password_hash, full_name FROM users WHERE email = ? OR username = ?',
            [loginIdentifier, loginIdentifier]
        );

        if (users.length === 0) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const user = users[0];
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Update last login time
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE userid = ?',
            [user.userid]
        );

        // Create JWT token
        const token = jwt.sign(
            { userid: user.userid, username: user.username, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Remove sensitive data before sending response
        const { password_hash, ...userData } = user;

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Login successful',
            token,
            user: userData
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'An error occurred during login. Please try again.'
        });
    }
}

function check(req, res) {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.userid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    // Return user information (excluding sensitive data)
    const { userid, username, email, full_name } = req.user;
    res.status(StatusCodes.OK).json({
      success: true,
      user: {
        userid,
        username,
        email,
        full_name
      }
    });
  } catch (error) {
    console.error('Check authentication error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while checking authentication status.'
    });
  }
}

async function forgotPassword(req, res) {
  const { email } = req.body;
  
  if (!email) {
    return res.status(StatusCodes.BAD_REQUEST).json({ 
      success: false,
      msg: "Please provide an email address." 
    });
  }

  try {
    // Check if user exists
    const [users] = await pool.query(
      "SELECT userid, email FROM users WHERE email = ?",
      [email]
    );
    
    if (users.length === 0) {
      // For security reasons, don't reveal if the email exists or not
      return res.status(StatusCodes.OK).json({ 
        success: true,
        msg: "If an account with that email exists, a password reset link has been sent." 
      });
    }

    const user = users[0];
    
    // Create a reset token that expires in 1 hour
    const token = jwt.sign(
      { userid: user.userid }, 
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
    
    // In a real app, you might want to store this token in the database
    // with an expiration time and check it when resetting the password
    
    const resetLink = `http://localhost:5173/reset-password/${token}`;
    
    // Only try to send email if email configuration is set up
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { 
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS 
          },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Password Reset - Evangadi Forum",
          html: `
            <p>You requested a password reset for your Evangadi Forum account.</p>
            <p>Click the link below to reset your password (valid for 1 hour):</p>
            <p><a href="${resetLink}">${resetLink}</a></p>
            <p>If you didn't request this, please ignore this email.</p>
          `,
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Continue with the response even if email fails
      }
    } else {
      console.log('Email configuration not set. Reset link:', resetLink);
    }

    // Always return the same response for security reasons
    res.status(StatusCodes.OK).json({ 
      success: true,
      msg: "If an account with that email exists, a password reset link has been sent." 
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      msg: "An error occurred while processing your request." 
    });
  }
}

async function resetPassword(req, res) {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 8) {
    return res.status(StatusCodes.BAD_REQUEST).json({ 
      success: false,
      msg: "Password is required and must be at least 8 characters." 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userid;
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "UPDATE users SET password_hash = ? WHERE userid = ?",
      [hashedPassword, userId]
    );
    
    res.status(StatusCodes.OK).json({ 
      success: true,
      msg: "Password has been reset successfully." 
    });
  } catch (err) {
    console.error('Password reset error:', err);
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        success: false,
        msg: "Invalid or expired reset link." 
      });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      msg: "An error occurred while resetting the password." 
    });
  }
}

module.exports = { register, login, check, forgotPassword, resetPassword };
