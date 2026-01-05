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

        // 2. Create labs table (Updated Schema)
        console.log('Creating labs table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS labs (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                total_seats INTEGER NOT NULL DEFAULT 0,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Fix existing labs table schema (Migration)
        await pool.query(`
            DO $$ 
            BEGIN
                -- Rename capacity to total_seats if needed
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='labs' AND column_name='capacity') THEN
                    ALTER TABLE labs RENAME COLUMN capacity TO total_seats;
                END IF;

                -- Add total_seats if missing (and capacity didn't exist)
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='labs' AND column_name='total_seats') THEN
                    ALTER TABLE labs ADD COLUMN total_seats INTEGER DEFAULT 0;
                END IF;

                -- Add status if missing
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='labs' AND column_name='status') THEN
                    ALTER TABLE labs ADD COLUMN status VARCHAR(20) DEFAULT 'active';
                END IF;
            END $$;
        `);
        console.log('✅ labs table created/updated');

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
                -- Add academic_year if missing
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='users' AND column_name='academic_year'
                ) THEN
                    ALTER TABLE users ADD COLUMN academic_year INTEGER;
                END IF;

                -- Add user_status if missing
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='users' AND column_name='user_status'
                ) THEN
                    ALTER TABLE users ADD COLUMN user_status VARCHAR(20) DEFAULT 'active';
                END IF;
            END $$;
        `);
        console.log('✅ users table updated');

        // 5. Create Placement Module Tables
        console.log('Creating placement_drives table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS placement_drives (
                id SERIAL PRIMARY KEY,
                company_name VARCHAR(255) NOT NULL,
                role VARCHAR(255) NOT NULL,
                description TEXT,
                job_type VARCHAR(50) CHECK (job_type IN ('FULL_TIME', 'INTERNSHIP', 'BOTH')),
                stipend_ctc VARCHAR(100),
                location VARCHAR(255),
                deadline TIMESTAMP NOT NULL,
                criteria JSONB DEFAULT '{}',
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) DEFAULT 'OPEN'
            );
        `);
        console.log('✅ placement_drives table created');

        console.log('Creating placement_applications table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS placement_applications (
                id SERIAL PRIMARY KEY,
                drive_id INTEGER REFERENCES placement_drives(id) ON DELETE CASCADE,
                student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                status VARCHAR(50) DEFAULT 'APPLIED',
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resume_link TEXT,
                UNIQUE(drive_id, student_id)
            );
        `);
        console.log('✅ placement_applications table created');

        // 6. Add Placement Columns to Users
        console.log('Adding placement fields to users table...');
        await pool.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='cgpa') THEN
                    ALTER TABLE users ADD COLUMN cgpa DECIMAL(4, 2) DEFAULT 0.00;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='resume_link') THEN
                    ALTER TABLE users ADD COLUMN resume_link TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='skills') THEN
                    ALTER TABLE users ADD COLUMN skills TEXT[];
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='experience_years') THEN
                    ALTER TABLE users ADD COLUMN experience_years INTEGER DEFAULT 0;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='branch') THEN
                     -- Try to infer or default, but just adding column for now
                    ALTER TABLE users ADD COLUMN branch VARCHAR(50);
                END IF;
            END $$;
        `);
        console.log('✅ users table updated with placement fields');

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


// If executed directly
if (require.main === module) {
    createMissingTables();
}

module.exports = { createMissingTables };
