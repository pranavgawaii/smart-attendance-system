const { pool } = require('../src/config/db');

const migrateAssessments = async () => {
    try {
        console.log('🔄 Starting Assessments Migration...');

        // 1. Create Assessments Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS assessments (
                id SERIAL PRIMARY KEY,
                title VARCHAR(150) NOT NULL,
                description TEXT,
                date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, COMPLETED
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created assessments table');

        // 2. Create Assessment Eligibility Table (Many-to-Many)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS assessment_eligibility (
                id SERIAL PRIMARY KEY,
                assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(assessment_id, user_id) -- Prevent duplicate entries
            );
        `);
        console.log('✅ Created assessment_eligibility table');

        // Indexes
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_assessments_date ON assessments(date);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_eligibility_assessment_id ON assessment_eligibility(assessment_id);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_eligibility_user_id ON assessment_eligibility(user_id);`);

        console.log('🚀 Migration Complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration Failed:', err);
        process.exit(1);
    }
};

migrateAssessments();
