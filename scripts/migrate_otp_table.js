const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function migrateOtpTable() {
    try {
        console.log('Creating otp_tokens table...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS otp_tokens (
                id SERIAL PRIMARY KEY,
                email VARCHAR(100) NOT NULL,
                otp_hash VARCHAR(255) NOT NULL,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ otp_tokens table created successfully!');

        // Also add user_status column if missing
        console.log('Adding user_status column to users table if missing...');
        await pool.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='users' AND column_name='user_status'
                ) THEN
                    ALTER TABLE users ADD COLUMN user_status VARCHAR(20) DEFAULT 'active';
                END IF;
            END $$;
        `);

        console.log('✅ user_status column added/verified!');

        // Also add academic_year column if missing
        console.log('Adding academic_year column to users table if missing...');
        await pool.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='users' AND column_name='academic_year'
                ) THEN
                    ALTER TABLE users ADD COLUMN academic_year VARCHAR(20);
                END IF;
            END $$;
        `);

        console.log('✅ academic_year column added/verified!');

        console.log('\n🎉 All migrations completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await pool.end();
    }
}

migrateOtpTable();
