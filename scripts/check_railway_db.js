const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function checkRailwayDatabase() {
    try {
        console.log('🔍 Checking Railway Database State...\n');

        // 1. Check total user count
        const countQuery = 'SELECT role, user_status, COUNT(*) as count FROM users GROUP BY role, user_status';
        const { rows: counts } = await pool.query(countQuery);
        console.log('📊 User Distribution:');
        counts.forEach(row => {
            console.log(`  ${row.role} (${row.user_status}): ${row.count} users`);
        });

        // 2. Check if specific student exists
        console.log('\n🔍 Checking adt23socb0030...');
        const studentQuery = 'SELECT * FROM users WHERE email = $1';
        const { rows: student } = await pool.query(studentQuery, ['adt23socb0030@student.mitadt.edu']);

        if (student.length > 0) {
            console.log('✅ Student EXISTS in database:');
            console.log(JSON.stringify(student[0], null, 2));
        } else {
            console.log('❌ Student NOT FOUND in database');
        }

        // 3. List first 5 students
        console.log('\n👥 First 5 students in database:');
        const listQuery = 'SELECT email, role, user_status FROM users WHERE role = $1 LIMIT 5';
        const { rows: students } = await pool.query(listQuery, ['student']);
        students.forEach(s => {
            console.log(`  ${s.email} - ${s.role} (${s.user_status})`);
        });

        // 4. Check database connection string
        console.log('\n🔗 Database Info:');
        console.log(`  Connected to: ${process.env.DATABASE_URL ? 'DATABASE_URL is set' : 'NO DATABASE_URL'}`);
        console.log(`  Is localhost: ${process.env.DATABASE_URL?.includes('localhost')}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkRailwayDatabase();
