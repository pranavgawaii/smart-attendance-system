const { pool } = require('../src/config/db');

async function verifyAllocation() {
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

    // 1. Create Test Assessment
    console.log('📝 Creating Assessment...');
    const assessRes = await fetch(`${baseURL}/assessments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            title: "Allocation Safety Test",
            description: "Testing constraints",
            date: "2025-01-01",
            start_time: "10:00",
            end_time: "11:00"
        })
    });
    const assessment = await assessRes.json();
    console.log(`Assessment ID: ${assessment.id}`);

    // 2. Add Candidate
    console.log('bust adding candidates...');
    // Fetch a user
    const usersRes = await pool.query("SELECT id FROM users WHERE role='student' LIMIT 2");
    const userIds = usersRes.rows.map(u => u.id);

    await fetch(`${baseURL}/assessments/${assessment.id}/candidates`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userIds })
    });

    // 3. Auto Allocate
    console.log('⚡ Auto Allocating...');
    const genRes = await fetch(`${baseURL}/assessments/${assessment.id}/allocations/generate`, {
        method: 'POST',
        headers
    });
    const { allocations } = await genRes.json();
    console.log(`Generated ${allocations.length} allocations`);

    // 4. Confirm
    console.log('💾 Confirming...');
    await fetch(`${baseURL}/assessments/${assessment.id}/allocations/confirm`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ allocations })
    });

    // 5. Test Conflict (Move User 2 to User 1's seat)
    console.log('⚔️ Testing Conflict (Safety Rule)...');
    // Get allocations from DB to get IDs
    const savedAllocRes = await fetch(`${baseURL}/assessments/${assessment.id}/allocations`, { headers });
    const savedAlloc = await savedAllocRes.json();

    const victim = savedAlloc[0]; // Seat X
    const attacker = savedAlloc[1]; // Seat Y

    console.log(`Attempting to move ${attacker.user_name} (Seat ${attacker.seat_number}) to Seat ${victim.seat_number}...`);

    const conflictRes = await fetch(`${baseURL}/assessments/${assessment.id}/allocations/${attacker.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
            labId: victim.lab_id,
            seatNumber: victim.seat_number
        })
    });

    if (conflictRes.status === 409) {
        console.log('✅ Safety Check Passed: Duplicate seat update prevented (409 Conflict).');
    } else {
        console.log(`❌ Safety Check Failed: Status ${conflictRes.status}`);
    }

    process.exit(0);
}

verifyAllocation();
