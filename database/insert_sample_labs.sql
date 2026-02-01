-- Clear existing data
DELETE FROM labs;

-- Insert sample lab data
INSERT INTO labs (lab_name, capacity, status) VALUES
('Lab 501', 60, 'enabled'),
('Lab 502', 60, 'enabled'),
('Lab 503', 45, 'enabled'),
('Lab 504', 45, 'enabled'),
('Lab 505', 30, 'enabled'),
('Lab 601', 60, 'disabled'),
('Lab 602', 50, 'enabled');

-- Verify insertion
SELECT * FROM labs ORDER BY lab_name;
