async function testPort3000() {
    const baseURL = 'http://localhost:3000/api';
    try {
        console.log('Trying Port 3000...');
        const res = await fetch(`${baseURL}/health`); // assuming /health exists
        if (res.ok) console.log('✅ Port 3000 is ACTIVE and responding!');
        else console.log(`❌ Port 3000 returned ${res.status}`);
    } catch (e) {
        console.log('❌ Port 3000 Failed:', e.message);
    }
}
testPort3000();
