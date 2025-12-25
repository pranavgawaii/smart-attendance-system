async function checkUsersApi() {
    const baseURL = 'http://localhost:3000';

    // Login
    console.log('🔑 Login...');
    const loginRes = await fetch(`${baseURL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@test.com', otp: '123456' })
    });
    const { token } = await loginRes.json();
    const headers = { 'Authorization': `Bearer ${token}` };

    console.log('👥 Fetching Users...');
    const res = await fetch(`${baseURL}/users`, { headers });
    const data = await res.json();

    console.log('Status:', res.status);
    console.log('Data Type:', Array.isArray(data) ? 'Array' : typeof data);
    if (!Array.isArray(data)) console.log('Structure:', JSON.stringify(data).slice(0, 100));
    else console.log('First User:', data[0]);

    process.exit(0);
}

checkUsersApi();
