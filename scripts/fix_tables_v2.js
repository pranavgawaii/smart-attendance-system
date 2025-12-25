const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function fixTables() {
    try {
        console.log('🔧 Fixing table anomalies...\n');

        // 1. Create assessment_eligibility table (Missing)
        console.log('Creating assessment_eligibility table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS assessment_eligibility (
                assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (assessment_id, user_id)
            );
        `);
        console.log('✅ assessment_eligibility table created');

        // 2. Rename seat_allocations to assessment_allocations (Name Mismatch)
        console.log('Checking seat_allocations vs assessment_allocations...');

        // Check if seat_allocations exists
        const checkSeat = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'seat_allocations'
            );
        `);

        // Check if assessment_allocations exists
        const checkAssessmentAlloc = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'assessment_allocations'
            );
        `);

        if (checkSeat.rows[0].exists && !checkAssessmentAlloc.rows[0].exists) {
            console.log('Renaming seat_allocations to assessment_allocations...');
            await pool.query('ALTER TABLE seat_allocations RENAME TO assessment_allocations;');
            console.log('✅ Table renamed successfully');
        } else if (!checkAssessmentAlloc.rows[0].exists) {
            console.log('Creating assessment_allocations table...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS assessment_allocations (
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
            console.log('✅ assessment_allocations table created');
        } else {
            console.log('ℹ️ assessment_allocations already exists.');
        }

        console.log('\n🎉 All table issues resolved!');

    } catch (error) {
        console.error('❌ Fix failed:', error);
        console.error('Error details:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// If executed directly
if (require.main === module) {
    fixTables();
}

module.exports = { fixTables };
