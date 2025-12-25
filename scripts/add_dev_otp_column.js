const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function addDevOtpColumn() {
    try {
        console.log('Adding dev_otp column to otp_tokens table...');

        await pool.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='otp_tokens' AND column_name='dev_otp'
                ) THEN
                    ALTER TABLE otp_tokens ADD COLUMN dev_otp VARCHAR(10);
                    RAISE NOTICE 'dev_otp column added successfully';
                ELSE
                    RAISE NOTICE 'dev_otp column already exists';
                END IF;
            END $$;
        `);

        console.log('✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await pool.end();
    }
}

addDevOtpColumn();
