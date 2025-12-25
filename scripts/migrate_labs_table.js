const { pool } = require('../src/config/db');

const migrateLabs = async () => {
    try {
        console.log('🔄 Starting Labs Table Migration...');

        // Create Labs Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS labs (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                total_seats INTEGER NOT NULL CHECK (total_seats > 0),
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created labs table');

        // Create Index on status for faster filtering
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_labs_status ON labs(status);
        `);
        console.log('✅ Created index on status');

        console.log('🚀 Migration Complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration Failed:', err);
        process.exit(1);
    }
};

migrateLabs();
