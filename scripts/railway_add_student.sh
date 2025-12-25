#!/bin/bash

# Railway One-Time Command to Add Student
# Run this in Railway dashboard: Settings > Deploy > One-off Command

echo "🌱 Adding student to production database..."

node -e "
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function addStudent() {
    try {
        const result = await pool.query(
            \`INSERT INTO users (name, email, enrollment_no, branch, academic_year, role, user_status)
             VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7)
             ON CONFLICT (email) 
             DO UPDATE SET 
                role = EXCLUDED.role,
                user_status = EXCLUDED.user_status
             RETURNING *\`,
            ['Student TY 18', 'adt24socb0018@student.mitadt.edu', 'ADT24SOCB0018', 'SOC', '2024', 'student', 'active']
        );
        
        console.log('✅ Student added:', result.rows[0].email);
        console.log('   Role:', result.rows[0].role);
        console.log('   Status:', result.rows[0].user_status);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

addStudent();
"

echo "✅ Done!"
