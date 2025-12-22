-- Database Schema for Smart PPT Attendance System

-- Enable uuid-ossp extension for UUID generation if needed (optional, using SERIAL/INTEGER for simplicity based on requirements, but UUID is better for security)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define User Roles
CREATE TYPE user_role AS ENUM ('student', 'admin');

-- 1. Users Table
-- Stores all users (students and admins)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    enrollment_no VARCHAR(50) UNIQUE, -- Nullable for admins
    branch VARCHAR(50), -- e.g., CSE, ECE
    role user_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Events Table
-- Stores details of classes or events
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL, -- e.g., "Data Structures Lecture"
    venue VARCHAR(100), -- e.g., "Hall A"
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    qr_refresh_interval INTEGER DEFAULT 10, -- Seconds after which QR code refreshes
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Admin who created the event
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. QR Sessions Table
-- Stores dynamic QR tokens generated during an event
CREATE TABLE qr_sessions (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL, -- Unique string encoded in the QR
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Attendance Logs Table
-- Records the actual attendance scan
CREATE TABLE attendance_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    qr_session_id INTEGER REFERENCES qr_sessions(id) ON DELETE SET NULL, -- Connects to specific QR instance
    scan_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    device_hash VARCHAR(255), -- To prevent proxy attendance from same device
    status VARCHAR(20) DEFAULT 'present', -- present, late, etc.
    UNIQUE(user_id, event_id) -- User can mark attendance only once per event
);

-- 5. OTP Tokens Table
-- Stores hashed OTPs for authentication
CREATE TABLE otp_tokens (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_enrollment ON users(enrollment_no);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_qr_sessions_event_id ON qr_sessions(event_id);
CREATE INDEX idx_attendance_logs_user_id ON attendance_logs(user_id);
CREATE INDEX idx_attendance_logs_event_id ON attendance_logs(event_id);
