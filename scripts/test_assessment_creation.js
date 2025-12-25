const assessmentModel = require('../src/models/assessment.model');
const { pool } = require('../src/config/db');

async function testCreate() {
    try {
        console.log('Testing Assessment Creation...');
        const newAssessment = await assessmentModel.create({
            title: "Test Assessment " + Date.now(),
            description: "Test Description",
            date: "2025-01-01",
            start_time: "10:00:00",
            end_time: "12:00:00"
        });
        console.log('✅ Created:', newAssessment);
        process.exit(0);
    } catch (e) {
        console.error('❌ Failed:', e);
        process.exit(1);
    }
}

testCreate();
