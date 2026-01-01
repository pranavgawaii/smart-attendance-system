-- Migration 003: Placement Module & Student CGPA

-- 1. Add CGPA to Users Table (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS cgpa DECIMAL(4,2) DEFAULT 0.00;

-- 2. Placement Drives Table
CREATE TABLE IF NOT EXISTS placement_drives (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL,
    role VARCHAR(100) NOT NULL,
    job_type VARCHAR(50) CHECK (job_type IN ('INTERNSHIP', 'FULL_TIME')) NOT NULL,
    stipend_ctc VARCHAR(100),
    description TEXT,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Eligibility Rules Table
CREATE TABLE IF NOT EXISTS eligibility_rules (
    id SERIAL PRIMARY KEY,
    drive_id INTEGER REFERENCES placement_drives(id) ON DELETE CASCADE,
    min_cgpa DECIMAL(4,2) DEFAULT 0.00,
    allowed_branches TEXT[], -- Array of strings e.g., ['CS', 'IT']
    allowed_years INTEGER[]  -- Array of integers e.g., [2024, 2025]
);

-- 4. Drive Applications Table
CREATE TABLE IF NOT EXISTS drive_applications (
    id SERIAL PRIMARY KEY,
    drive_id INTEGER REFERENCES placement_drives(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'APPLIED', -- APPLIED, SHORTLISTED, REJECTED
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(drive_id, student_id)
);

-- 5. Application Documents Table
CREATE TABLE IF NOT EXISTS application_documents (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES drive_applications(id) ON DELETE CASCADE,
    resume_url TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_placement_drives_deadline ON placement_drives(deadline);
CREATE INDEX IF NOT EXISTS idx_drive_applications_student_id ON drive_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_drive_applications_drive_id ON drive_applications(drive_id);
