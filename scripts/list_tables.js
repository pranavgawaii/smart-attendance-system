require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listTables() {
    console.log('🔍 Listing tables in public schema...');
    const tables = [
        'user_profiles', 'placement_drives', 'eligibility_rules',
        'drive_applications', 'events', 'qr_sessions',
        'attendance_logs', 'labs', 'assessments',
        'assessment_eligibility', 'assessment_allocations'
    ];

    for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(0);
        if (error) {
            if (error.message.includes('does not exist')) {
                console.log(`❌ Table ${table}: NOT FOUND`);
            } else {
                console.log(`⚠️ Table ${table}: Error check (${error.message})`);
            }
        } else {
            console.log(`✅ Table ${table}: FOUND`);
        }
    }
}

listTables();
