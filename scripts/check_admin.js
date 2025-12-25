const { pool } = require('../src/config/db');

async function checkAdmin() {
    try {
        const res = await pool.query("SELECT id, email, role FROM users WHERE role = 'admin'");
        console.log('Admin Users Found:', res.rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkAdmin();
