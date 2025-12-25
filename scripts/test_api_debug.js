async function testApi() {
    const baseURL = 'http://localhost:3000';

    try {
        console.log('🔑 Attempting Login...');
        const loginRes = await fetch(`${baseURL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@test.com', otp: '123456' })
        });

        console.log(`Response Status: ${loginRes.status} ${loginRes.statusText}`);
        const rawText = await loginRes.text();
        console.log('Response Body:', rawText);

        if (!loginRes.ok) throw new Error('Login Failed');

        const loginData = JSON.parse(rawText);
        const token = loginData.token;

        // ... (rest skipped for now, just want to see login succeed)

    } catch (error) {
        console.error('❌ API Test Failed:', error.message);
    }
}

testApi();
