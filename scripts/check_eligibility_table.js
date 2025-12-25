const { pool } = require('../src/config/db');

async function checkTable() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'assessment_eligibility';
        `);
        console.log('Columns:', res.rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkTable();
