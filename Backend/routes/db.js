const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',      // Default XAMPP user
  password: '',      // Default XAMPP password is empty
  database: 'acadly_db'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to XAMPP MySQL:', err);
    return;
  }
  console.log('Connected to XAMPP MySQL database!');
});

module.exports = connection;