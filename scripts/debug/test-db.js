require('dotenv').config();
const { supabase } = require('./src/config/db');

async function test() {
    try {
        console.log('Testing Supabase connection...');
        const { data, error } = await supabase
            .from('placement_coordinators')
            .select('*');
        
        if (error) {
            console.error('Error fetching coordinators:', error);
        } else {
            console.log('Successfully fetched coordinators:', data.length);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

test();
