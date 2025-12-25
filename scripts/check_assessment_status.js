const { pool } = require('../src/config/db');

async function checkStatus() {
    try {
        const res = await pool.query("SELECT id, title, status FROM assessments");
        console.table(res.rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkStatus();
