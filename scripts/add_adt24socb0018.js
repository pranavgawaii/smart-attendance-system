const { Pool } = require('pg');
require('dotenv').config();

// This script adds the student adt24socb0018 to the database
// Run with: node scripts/add_adt24socb0018.js

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function addStudent() {
    try {
        console.log('Adding student adt24socb0018@student.mitadt.edu...\n');

        const result = await pool.query(
            `INSERT INTO users (name, email, enrollment_no, branch, academic_year, role, user_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (email) 
             DO UPDATE SET 
                role = EXCLUDED.role,
                user_status = EXCLUDED.user_status,
                enrollment_no = EXCLUDED.enrollment_no
             RETURNING *`,
            ['Student TY 18', 'adt24socb0018@student.mitadt.edu', 'ADT24SOCB0018', 'SOC', '2024', 'student', 'active']
        );

        console.log('✅ Student added/updated successfully!');
        console.log('\nStudent Details:');
        console.log(`  ID: ${result.rows[0].id}`);
        console.log(`  Name: ${result.rows[0].name}`);
        console.log(`  Email: ${result.rows[0].email}`);
        console.log(`  Enrollment: ${result.rows[0].enrollment_no}`);
        console.log(`  Role: ${result.rows[0].role}`);
        console.log(`  Status: ${result.rows[0].user_status}`);
        console.log('\n✅ Student can now log in!');

    } catch (error) {
        console.error('❌ Error adding student:', error.message);
    } finally {
        await pool.end();
    }
}

addStudent();
