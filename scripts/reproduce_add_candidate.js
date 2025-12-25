const { pool } = require('../src/config/db');

async function reproduce() {
    const baseURL = 'http://localhost:3000';

    // Login
    console.log('🔑 Login...');
    const loginRes = await fetch(`${baseURL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@test.com', otp: '123456' })
    });
    const { token } = await loginRes.json();
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // Create Test Assessment
    console.log('📝 Creating Assessment...');
    const assessRes = await fetch(`${baseURL}/assessments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            title: "Candidate Add Test",
            description: "Testing candidate add",
            date: "2025-01-01",
            start_time: "10:00",
            end_time: "11:00"
        })
    });
    const assessment = await assessRes.json();
    console.log(`Assessment ID: ${assessment.id}`);

    // Get a user ID
    const userRes = await pool.query("SELECT id FROM users LIMIT 1");
    const userId = userRes.rows[0].id;
    console.log(`Trying to add User ID: ${userId}`);

    // Call Add Candidates API
    console.log('➕ Adding Candidate...');
    const addRes = await fetch(`${baseURL}/assessments/${assessment.id}/candidates`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userIds: [userId] })
    });

    console.log(`Status: ${addRes.status}`);
    const body = await addRes.text();
    console.log(`Body: ${body}`);

    process.exit(0);
}

reproduce();
