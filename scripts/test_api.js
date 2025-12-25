async function testApi() {
    const baseURL = 'http://localhost:5000/api';

    try {
        console.log('🔑 Attempting Login...');
        // 1. Login with Magic OTP
        // Using native fetch
        const loginRes = await fetch(`${baseURL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@test.com', otp: '123456' })
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(`Login Failed: ${JSON.stringify(loginData)}`);

        const token = loginData.token;
        console.log('✅ Login Successful. Token:', token ? 'Recieved' : 'Missing');

        const headers = { 'Authorization': `Bearer ${token}` };

        // 2. Fetch Users
        console.log('👥 Fetching Users...');
        const usersRes = await fetch(`${baseURL}/users`, { headers });
        const usersData = await usersRes.json();
        console.log(`✅ Users API: ${usersRes.status} OK. Count: ${usersData.length}`);

        // 3. Fetch Assessments
        console.log('🧪 Fetching Assessments...');
        const assessRes = await fetch(`${baseURL}/assessments`, { headers });
        const assessData = await assessRes.json();
        console.log(`✅ Assessments API: ${assessRes.status} OK. Count: ${assessData.length}`);

    } catch (error) {
        console.error('❌ API Test Failed:', error.message);
        if (error.cause) console.error('Cause:', error.cause);
    }
}

testApi();
