-- Create database
CREATE DATABASE IF NOT EXISTS acadly_db;

-- Use the database
USE acadly_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample user for testing
INSERT INTO users (email, password, name) VALUES
('test@example.com', 'password123', 'Test User')
ON DUPLICATE KEY UPDATE email=email;