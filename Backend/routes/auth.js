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

module.exports = router;