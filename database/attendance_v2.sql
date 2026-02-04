-- Database Schema for QR Attendance V2

-- 1. QR Tokens Table
CREATE TABLE IF NOT EXISTS qr_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  code TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  used_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_qr_tokens_session ON qr_tokens(session_id);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_active ON qr_tokens(is_active) WHERE is_active = true;

-- 2. Proxy Attempts Table
CREATE TABLE IF NOT EXISTS proxy_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  student_id UUID REFERENCES user_profiles(id),
  student_email TEXT,
  original_fingerprint TEXT,
  attempted_fingerprint TEXT,
  original_device JSONB,
  attempted_device JSONB,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proxy_attempts_session ON proxy_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_proxy_attempts_student ON proxy_attempts(student_id);

-- 3. Add columns to attendance_logs if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance_logs' AND column_name='device_fingerprint') THEN
        ALTER TABLE attendance_logs ADD COLUMN device_fingerprint TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance_logs' AND column_name='device_info') THEN
        ALTER TABLE attendance_logs ADD COLUMN device_info JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance_logs' AND column_name='scan_method') THEN
        ALTER TABLE attendance_logs ADD COLUMN scan_method TEXT DEFAULT 'qr';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance_logs' AND column_name='is_locked') THEN
        ALTER TABLE attendance_logs ADD COLUMN is_locked BOOLEAN DEFAULT true;
    END IF;

    -- Additional columns identified as missing from logs
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance_logs' AND column_name='enrollment_no') THEN
        ALTER TABLE attendance_logs ADD COLUMN enrollment_no TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance_logs' AND column_name='student_email') THEN
        ALTER TABLE attendance_logs ADD COLUMN student_email TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance_logs' AND column_name='student_name') THEN
        ALTER TABLE attendance_logs ADD COLUMN student_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance_logs' AND column_name='scanned_at') THEN
        ALTER TABLE attendance_logs ADD COLUMN scanned_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;
