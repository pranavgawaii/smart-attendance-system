const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function fixSchema() {
    try {
        console.log('🔧 Fixing database schema issues...\n');

        // 1. Add missing 'date' column to assessments
        // The backend code explicitly inserts into this column
        console.log('Checking assessments table for date column...');
        await pool.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='assessments' AND column_name='date'
                ) THEN
                    ALTER TABLE assessments ADD COLUMN date DATE;
                END IF;
            END $$;
        `);
        console.log('✅ assessments table updated (date column added)');

        console.log('\n🎉 Schema fixes applied successfully!');

    } catch (error) {
        console.error('❌ Schema fix failed:', error);
        console.error('Error details:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// If executed directly
if (require.main === module) {
    fixSchema();
}

module.exports = { fixSchema };
