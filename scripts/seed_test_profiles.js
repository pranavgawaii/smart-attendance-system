require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedTestProfiles() {
    console.log('🌱 Seeding test profiles into Supabase...');

    const testUsers = [
        {
            email: 'student1@test.com',
            name: 'Test Student',
            enrollment_no: 'TEST001',
            role: 'student',
            branch: 'CSE',
            academic_year: '2025-2026',
            user_status: 'active'
        },
        {
            email: 'pranavvgawai@gmail.com',
            name: 'Pranav Gawai',
            enrollment_no: 'ADMIN001',
            role: 'super_admin',
            branch: 'ADMIN',
            academic_year: 'N/A',
            user_status: 'active'
        },
        {
            email: 'pranavgawai1518@gmail.com',
            name: 'Pranav Gawai (Admin)',
            enrollment_no: 'ADMIN002',
            role: 'admin',
            branch: 'ADMIN',
            academic_year: 'N/A',
            user_status: 'active'
        }
    ];

    for (const user of testUsers) {
        console.log(`Checking ${user.email}...`);
        // Note: On first run, 'id' won't exist because these aren't linked to auth.users yet.
        // For test mode, we can either create auth users or just put them in profiles with random UUIDs.
        // Since verifyOtp for test accounts just looks for email in profiles, random UUID is fine.

        const { data: existing } = await supabase
            .from('user_profiles')
            .select('id, email')
            .eq('email', user.email)
            .maybeSingle();

        if (existing) {
            console.log(`User ${user.email} already exists. Updating...`);
            const { error } = await supabase
                .from('user_profiles')
                .update(user)
                .eq('email', user.email);
            if (error) console.error(`Error updating ${user.email}:`, error.message);
        } else {
            console.log(`Creating user ${user.email}...`);
            // Generate a random UUID if not provided. Profiles usually link to auth.users.id
            const { error } = await supabase
                .from('user_profiles')
                .insert([{ ...user, id: crypto.randomUUID() }]);
            if (error) console.error(`Error creating ${user.email}:`, error.message);
        }
    }

    console.log('✅ Seeding complete.');
}

seedTestProfiles();
