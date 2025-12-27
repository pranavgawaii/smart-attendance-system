const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function diagnose() {
    try {
        console.log('🔍 Diagnosing Assessment Details API Failure...\n');

        // 1. Check Tables Existence
        console.log('1. Checking Table Existence:');
        const tables = ['assessments', 'assessment_eligibility', 'assessment_allocations', 'seat_allocations'];
        for (const table of tables) {
            const res = await pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = $1
                );
            `, [table]);
            console.log(`   - ${table}: ${res.rows[0].exists ? '✅ Exists' : '❌ MISSING'}`);
        }

        // 2. Fetch Latest Assessment ID
        console.log('\n2. Fetching Latest Assessment:');
        const latestRes = await pool.query('SELECT id, title FROM assessments ORDER BY id DESC LIMIT 1');
        if (latestRes.rows.length === 0) {
            console.log('   ❌ No assessments found in DB.');
            process.exit(0);
        }
        const assessmentId = latestRes.rows[0].id;
        console.log(`   ✅ Found Assessment ID: ${assessmentId} ("${latestRes.rows[0].title}")`);

        // 3. Simulate getById Query
        console.log(`\n3. Testing findById(${assessmentId}):`);
        try {
            const findQuery = 'SELECT * FROM assessments WHERE id = $1';
            const findRes = await pool.query(findQuery, [assessmentId]);
            console.log(`   ✅ Success. Found: ${findRes.rows.length > 0}`);
        } catch (err) {
            console.log(`   ❌ Failed: ${err.message}`);
        }

        // 4. Simulate getEligibleCandidates Query (Crucial Step)
        console.log(`\n4. Testing getEligibleCandidates(${assessmentId}):`);
        try {
            const eligQuery = `
                SELECT u.id, u.name, u.email, u.enrollment_no, u.branch, u.academic_year
                FROM users u
                JOIN assessment_eligibility ae ON u.id = ae.user_id
                WHERE ae.assessment_id = $1
                ORDER BY u.name ASC;
            `;
            const eligRes = await pool.query(eligQuery, [assessmentId]);
            console.log(`   ✅ Success. Candidates found: ${eligRes.rows.length}`);
        } catch (err) {
            console.log(`   ❌ Failed: ${err.message}`);
        }

    } catch (error) {
        console.error('❌ Diagnose failed:', error);
    } finally {
        await pool.end();
    }
}

// If executed directly
if (require.main === module) {
    diagnose();
}
