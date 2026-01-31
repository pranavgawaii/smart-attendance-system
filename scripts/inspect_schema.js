require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectSchema() {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error inspecting user_profiles:', error.message);
    } else if (data && data.length > 0) {
        console.log('Columns in user_profiles:', Object.keys(data[0]));
    } else {
        console.log('user_profiles is empty. Let\'s try to get column names from information_schema if possible.');
        // In Supabase, we can't easily query information_schema via standard client.
        // However, we can try to insert a dummy row and see what it fails on.
    }
}

inspectSchema();
