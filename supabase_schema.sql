-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Events Table Updates (Safe to re-run)
ALTER TABLE events ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS qr_refresh_interval INTEGER DEFAULT 10;
ALTER TABLE events ADD COLUMN IF NOT EXISTS session_state TEXT DEFAULT 'DRAFT';
ALTER TABLE events ADD COLUMN IF NOT EXISTS current_token TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_display_id TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS entry_window_mins INTEGER DEFAULT 15;
ALTER TABLE events ADD COLUMN IF NOT EXISTS exit_window_mins INTEGER DEFAULT 15;
ALTER TABLE events ADD COLUMN IF NOT EXISTS attendance_phase TEXT DEFAULT 'CLOSED';
ALTER TABLE events ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by UUID;

-- 2. Supplemental Tables (Safe to re-run)
CREATE TABLE IF NOT EXISTS qr_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES events(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    code TEXT NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES events(id) ON DELETE CASCADE,
    student_email TEXT,
    student_name TEXT,
    enrollment_no TEXT,
    device_fingerprint TEXT,
    browser_info TEXT, -- optional
    screen_resolution TEXT, -- optional
    timezone TEXT, -- optional
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    scan_method TEXT,
    user_id UUID REFERENCES user_profiles(id),
    UNIQUE(session_id, student_email)
);

CREATE TABLE IF NOT EXISTS proxy_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES events(id) ON DELETE CASCADE,
    student_email TEXT,
    original_fingerprint TEXT,
    attempted_fingerprint TEXT,
    original_device TEXT,
    attempted_device TEXT,
    attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Policies (FIX: Drop first to avoid "already exists" error)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all select" ON events;
CREATE POLICY "Allow all select" ON events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin insert" ON events;
CREATE POLICY "Allow admin insert" ON events FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admin update" ON events;
CREATE POLICY "Allow admin update" ON events FOR UPDATE USING (auth.role() = 'authenticated');

-- Logs Policies
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Logs" ON attendance_logs;
CREATE POLICY "Public Read Logs" ON attendance_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated Insert Logs" ON attendance_logs;
CREATE POLICY "Authenticated Insert Logs" ON attendance_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Proxy Policies
ALTER TABLE proxy_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Proxy" ON proxy_attempts;
CREATE POLICY "Public Read Proxy" ON proxy_attempts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated Insert Proxy" ON proxy_attempts;
CREATE POLICY "Authenticated Insert Proxy" ON proxy_attempts FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- QR Policies
ALTER TABLE qr_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read QR" ON qr_tokens;
CREATE POLICY "Public Read QR" ON qr_tokens FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated Insert QR" ON qr_tokens;
CREATE POLICY "Authenticated Insert QR" ON qr_tokens FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Realtime (Safe)
do $$ 
begin 
  alter publication supabase_realtime add table attendance_logs; 
exception when duplicate_object then null; 
end $$;

do $$ 
begin 
  alter publication supabase_realtime add table proxy_attempts; 
exception when duplicate_object then null; 
end $$;

do $$ 
begin 
  alter publication supabase_realtime add table events; 
exception when duplicate_object then null; 
end $$;
