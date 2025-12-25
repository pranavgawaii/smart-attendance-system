const { pool } = require('../src/config/db');

async function clearStudents() {
    try {
        console.log('🗑️ Clearing Student Data...');
        // Delete only users with role 'student' or null (if any legacy)
        // Preserves 'admin' and 'faculty'
        const res = await pool.query("DELETE FROM users WHERE role = 'student'");
        console.log(`✅ Deleted ${res.rowCount} student records.`);
        process.exit(0);
    } catch (e) {
        console.error('❌ Failed to clear students:', e);
        process.exit(1);
    }
}

clearStudents();
