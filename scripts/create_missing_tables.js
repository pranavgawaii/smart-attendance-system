const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function createMissingTables() {
    try {
        console.log('🔧 Creating missing tables in Railway database...\n');

        // 1. Create assessments table
        console.log('Creating assessments table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS assessments (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP NOT NULL,
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) DEFAULT 'DRAFT'
            );
        `);
        console.log('✅ assessments table created');

        // 2. Create labs table
        console.log('Creating labs table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS labs (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                capacity INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ labs table created');

        // 3. Create seat_allocations table
        console.log('Creating seat_allocations table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS seat_allocations (
                id SERIAL PRIMARY KEY,
                assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                lab_id INTEGER REFERENCES labs(id),
                seat_number INTEGER NOT NULL,
                allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(assessment_id, user_id),
                UNIQUE(assessment_id, lab_id, seat_number)
            );
        `);
        console.log('✅ seat_allocations table created');

        // 4. Add missing columns to users table if needed
        console.log('Checking users table columns...');
        await pool.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='users' AND column_name='academic_year'
                ) THEN
                    ALTER TABLE users ADD COLUMN academic_year INTEGER;
                END IF;
            END $$;
        `);
        console.log('✅ users table updated');

        console.log('\n🎉 All missing tables created successfully!');
        console.log('\n📊 Database schema is now complete.');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.error('Error details:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

createMissingTables();
