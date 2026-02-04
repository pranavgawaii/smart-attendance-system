-- Migration for Placement Allocations System

-- 1. Create placement_assessments table
CREATE TABLE IF NOT EXISTS placement_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    position TEXT,
    assessment_date DATE,
    start_time TIME,
    end_time TIME,
    description TEXT,
    seating_mode TEXT DEFAULT 'normal',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id)
);

-- 2. Clean up and recreate allocations table with correct schema
DROP TABLE IF EXISTS allocations;

CREATE TABLE allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    placement_assessment_id UUID REFERENCES placement_assessments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES user_profiles(id),
    lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    seat_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE placement_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;

-- 4. Policies for placement_assessments
DROP POLICY IF EXISTS "Public Read Assessments" ON placement_assessments;
CREATE POLICY "Public Read Assessments" ON placement_assessments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated Insert Assessments" ON placement_assessments;
CREATE POLICY "Authenticated Insert Assessments" ON placement_assessments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Update Assessments" ON placement_assessments;
CREATE POLICY "Authenticated Update Assessments" ON placement_assessments FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Delete Assessments" ON placement_assessments;
CREATE POLICY "Authenticated Delete Assessments" ON placement_assessments FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Policies for allocations
DROP POLICY IF EXISTS "Public Read Allocations" ON allocations;
CREATE POLICY "Public Read Allocations" ON allocations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated Insert Allocations" ON allocations;
CREATE POLICY "Authenticated Insert Allocations" ON allocations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Update Allocations" ON allocations;
CREATE POLICY "Authenticated Update Allocations" ON allocations FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Delete Allocations" ON allocations;
CREATE POLICY "Authenticated Delete Allocations" ON allocations FOR DELETE USING (auth.role() = 'authenticated');
