const express = require('express');
const router = express.Router();
const db = require('./db'); // Import the connection from step 3

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Query to find user
  const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
  
  db.query(sql, [email, password], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length > 0) {
      // User found
      res.status(200).json({ 
        message: "Login successful", 
        user: results[0] 
      });
    } else {
      // User not found
      res.status(401).json({ message: "Invalid email or password" });
    }
  });
});

// Sign up user
router.post('/signup', (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const safeName = name || "";

  // Check if user already exists
  const checkSql = "SELECT id FROM users WHERE email = ?";
  db.query(checkSql, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Server error" });
    }

    if (results && results.length > 0) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Insert new user
    const insertSql =
      "INSERT INTO users (email, password, name) VALUES (?, ?, ?)";
    db.query(insertSql, [email, password, safeName], (insertErr, insertRes) => {
      if (insertErr) {
        return res.status(500).json({ message: "Server error" });
      }

      return res.status(201).json({
        message: "Signup successful",
        user: {
          id: insertRes?.insertId,
          email,
          name: safeName,
        },
      });
    });
  });
});

module.exports = router;