-- =====================================================
-- COORDINATOR FORMS SCHEMA
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1) FORMS TABLE
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE NOT NULL,
    is_public BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
    theme_settings JSONB DEFAULT '{"primaryColor": "#6366f1", "backgroundColor": "#f8fafc", "headerImage": null}', -- NEW
    deadline TIMESTAMPTZ, -- NEW
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- FOR EXISTING DATABASES:
-- ALTER TABLE forms ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;

-- FOR EXISTING DATABASES:
-- ALTER TABLE forms ADD COLUMN IF NOT EXISTS theme_settings JSONB DEFAULT '{"primaryColor": "#6366f1", "backgroundColor": "#f8fafc", "headerImage": null}';

-- 2) FORM FIELDS TABLE
CREATE TABLE IF NOT EXISTS form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE NOT NULL,
    label TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK (field_type IN ('short_text', 'long_text', 'email', 'number', 'select')),
    required BOOLEAN DEFAULT true,
    options JSONB, -- for 'select': { "choices": ["CSE","IT","ECE"] }
    sort_order INTEGER DEFAULT 0
);

-- 3) FORM RESPONSES TABLE
CREATE TABLE IF NOT EXISTS form_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    submitted_by UUID REFERENCES auth.users(id), -- nullable for anonymous
    answers JSONB NOT NULL, -- { "<field_id>": "value" }
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'shortlisted', 'rejected', 'on_hold')),
    notes TEXT -- internal admin notes
);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'coordinator_admin') OR
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin', 'coordinator_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FORMS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "Admin full access on forms"
    ON forms FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Public: Read active public forms only (for form display)
CREATE POLICY "Public can read active public forms"
    ON forms FOR SELECT
    USING (is_public = true AND status = 'active');

-- =====================================================
-- FORM FIELDS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "Admin full access on form_fields"
    ON form_fields FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Public: Read fields of active public forms
CREATE POLICY "Public can read fields of active forms"
    ON form_fields FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM forms
            WHERE forms.id = form_fields.form_id
            AND forms.is_public = true
            AND forms.status = 'active'
        )
    );

-- =====================================================
-- FORM RESPONSES POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "Admin full access on form_responses"
    ON form_responses FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Public: INSERT only into active public forms
CREATE POLICY "Public can submit responses to active forms"
    ON form_responses FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM forms
            WHERE forms.id = form_responses.form_id
            AND forms.is_public = true
            AND forms.status = 'active'
        )
    );

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);
CREATE INDEX IF NOT EXISTS idx_form_fields_form_id ON form_fields(form_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_form_id ON form_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_status ON form_responses(status);
