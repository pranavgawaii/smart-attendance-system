require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkQrColumns() {
    console.log('🔍 Checking qr_sessions columns...');
    const { data, error } = await supabase.from('qr_sessions').select('*').limit(1);
    if (error) {
        console.error('❌ Error selecting from qr_sessions:', error.message);
    } else if (data && data.length > 0) {
        console.log('✅ Columns in qr_sessions:', Object.keys(data[0]));
    } else {
        console.log('qr_sessions is empty, checking specific column...');
        const { error: error2 } = await supabase.from('qr_sessions').select('event_id').limit(1);
        if (error2) {
            console.error('❌ event_id column NOT found:', error2.message);
        } else {
            console.log('✅ event_id column FOUND');
        }
    }
}

checkQrColumns();
