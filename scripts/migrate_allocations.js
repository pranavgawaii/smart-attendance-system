const { pool } = require('../src/config/db');

const migrateAllocations = async () => {
    try {
        console.log('🔄 Starting Allocations Migration...');

        // Create Allocations Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS assessment_allocations (
                id SERIAL PRIMARY KEY,
                assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                lab_id INTEGER REFERENCES labs(id) ON DELETE CASCADE,
                seat_number INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(assessment_id, user_id), -- One seat per student per assessment
                UNIQUE(assessment_id, lab_id, seat_number) -- No double booking in same lab
            );
        `);
        console.log('✅ Created assessment_allocations table');

        // Add indexes for performance
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_allocations_assessment ON assessment_allocations(assessment_id);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_allocations_lab ON assessment_allocations(lab_id);`);

        // Update assessments table to support status 'ALLOCATED' if not already handled by string/varchar
        // The status column is VARCHAR(20), so 'ALLOCATED' is fine without schema change.

        console.log('🚀 Migration Complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration Failed:', err);
        process.exit(1);
    }
};

migrateAllocations();
