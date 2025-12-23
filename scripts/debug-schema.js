const { Pool } = require('pg');
require('dotenv').config();

console.log('🔍 Inspecting "events" table schema...');

if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL is missing.');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

const inspectSchema = async () => {
    const client = await pool.connect();
    try {
        const query = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'events';
        `;
        const res = await client.query(query);
        console.table(res.rows);
    } catch (err) {
        console.error('❌ Error querying schema:', err);
    } finally {
        client.release();
        await pool.end();
    }
};

inspectSchema();
