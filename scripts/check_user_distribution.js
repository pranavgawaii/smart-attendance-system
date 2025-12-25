const { pool } = require('../src/config/db');

async function checkDistribution() {
    try {
        const fy = await pool.query("SELECT count(*) FROM users WHERE academic_year = 4");
        const ty = await pool.query("SELECT count(*) FROM users WHERE academic_year = 3");
        const all = await pool.query("SELECT id, name, enrollment_no, academic_year FROM users ORDER BY id ASC LIMIT 20");

        console.log('Final Year (4):', fy.rows[0].count);
        console.log('Third Year (3):', ty.rows[0].count);
        console.log('\nTop 20 Users by ID:');
        console.table(all.rows);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkDistribution();
