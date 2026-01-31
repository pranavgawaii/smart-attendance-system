require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumns() {
    console.log('🔍 Checking user_profiles columns via raw query...');
    // PostgREST doesn't support raw SQL, but we can try to get hints via errors or by inserting one field at a time.
    // Better: Try to Fetch a non-existent column and see the error message.

    const { error } = await supabase
        .from('user_profiles')
        .select('academic_year')
        .limit(1);

    if (error) {
        console.error('❌ Error selecting academic_year:', error.message);
    } else {
        console.log('✅ academic_year column exists!');
    }

    const { error: error2 } = await supabase
        .from('user_profiles')
        .select('branch')
        .limit(1);

    if (error2) {
        console.error('❌ Error selecting branch:', error2.message);
    } else {
        console.log('✅ branch column exists!');
    }
}

checkColumns();
