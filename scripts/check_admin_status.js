const { pool } = require('../src/config/db');

async function checkAdminStatus() {
    try {
        const res = await pool.query("SELECT * FROM users WHERE email = 'admin@test.com'");
        console.log('Admin User:', res.rows[0]);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkAdminStatus();
