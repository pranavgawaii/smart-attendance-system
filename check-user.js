require('dotenv').config();
const { supabase } = require('./src/config/db');

async function checkUser() {
    try {
        const email = process.env.ADMIN_EMAIL;
        console.log(`Checking profile for ${email}...`);
        
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('email', email)
            .maybeSingle();
        
        if (error) {
            console.error('Error fetching profile:', error);
        } else if (data) {
            console.log('Profile found:', JSON.stringify(data, null, 2));
        } else {
            console.log('No profile found for this email.');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkUser();
