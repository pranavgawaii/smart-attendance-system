const { pool } = require('../src/config/db');

async function checkAllocations() {
    try {
        console.log('🔍 Checking Allocations...');
        const res = await pool.query(`
            SELECT a.id, a.assessment_id, a.user_id, a.lab_id, a.seat_number, u.name as user, l.name as lab
            FROM assessment_allocations a
            JOIN users u ON a.user_id = u.id
            JOIN labs l ON a.lab_id = l.id
            ORDER BY a.id DESC LIMIT 10
        `);

        if (res.rows.length === 0) {
            console.log('⚠️ No allocations found in DB table `assessment_allocations`');
        } else {
            console.table(res.rows);
        }

        const count = await pool.query('SELECT count(*) FROM assessment_allocations');
        console.log(`Total Allocations: ${count.rows[0].count}`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkAllocations();
