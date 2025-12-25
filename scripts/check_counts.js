const { pool } = require('../src/config/db');

async function checkCounts() {
    try {
        const uRes = await pool.query('SELECT count(*) FROM users');
        const eRes = await pool.query('SELECT count(*) FROM events');
        const aRes = await pool.query('SELECT count(*) FROM assessments');
        const alRes = await pool.query('SELECT count(*) FROM attendance_logs');

        console.log(`Users: ${uRes.rows[0].count}`);
        console.log(`Events: ${eRes.rows[0].count}`);
        console.log(`Assessments: ${aRes.rows[0].count}`);
        console.log(`Attendance Logs: ${alRes.rows[0].count}`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkCounts();
