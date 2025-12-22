-- Example Database Operations

-- 1. Insert Users
-- Admin
INSERT INTO users (name, email, role) 
VALUES ('System Admin', 'admin@college.edu', 'admin');

-- Student
INSERT INTO users (name, email, enrollment_no, branch, role) 
VALUES ('John Doe', 'john.doe@student.edu', 'EN123456', 'CSE', 'student');

-- 2. Create Event (by Admin, assuming admin id=1)
INSERT INTO events (title, venue, start_time, end_time, qr_refresh_interval, created_by)
VALUES (
    'Introduction to Algorithms', 
    'Lecture Hall 3', 
    NOW(), 
    NOW() + INTERVAL '1 hour', 
    15, -- 15 seconds refresh
    1
);

-- 3. Generate a QR Session (simulated backend process)
-- Assuming event_id=1
INSERT INTO qr_sessions (event_id, token, expires_at)
VALUES (1, 'secure-random-token-xyz', NOW() + INTERVAL '15 seconds');

-- 4. Mark Attendance (Student scans QR)
-- Assuming user_id=2, event_id=1, qr_session_id=1
INSERT INTO attendance_logs (user_id, event_id, qr_session_id, device_hash)
VALUES (2, 1, 1, 'device-unique-hash-123');

-- 5. Queries
-- Get all attendance for a specific event
SELECT u.name, u.enrollment_no, a.scan_time 
FROM attendance_logs a
JOIN users u ON a.user_id = u.id
WHERE a.event_id = 1;

-- Get attendance history for a student
SELECT e.title, e.start_time, a.status 
FROM attendance_logs a
JOIN events e ON a.event_id = e.id
WHERE a.user_id = 2;
