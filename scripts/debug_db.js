const { Pool } = require('pg');
require('dotenv').config();

const testConnection = async (name, config) => {
    console.log(`Testing connection: ${name}...`);
    const pool = new Pool(config);
    try {
        const client = await pool.connect();
        console.log(`✅ [${name}] Successfully connected!`);
        client.release();
    } catch (err) {
        console.log(`❌ [${name}] Failed: ${err.message}`);
    } finally {
        await pool.end();
    }
};

(async () => {
    const url = process.env.DATABASE_URL;
    console.log("Base URL:", url);

    // 1. As is (relies on defaults)
    await testConnection('Default (string only)', { connectionString: url });

    // 2. With explicit SSL object
    await testConnection('Explicit SSL { rejectUnauthorized: false }', {
        connectionString: url,
        ssl: { rejectUnauthorized: false }
    });

    // 3. Modifying URL to include sslmode=require
    const urlWithSSL = url + (url.includes('?') ? '&' : '?') + 'sslmode=require';
    await testConnection('URL with sslmode=require', { connectionString: urlWithSSL });

    // 4. Modifying URL to include sslmode=no-verify
    const urlWithNoVerify = url + (url.includes('?') ? '&' : '?') + 'sslmode=no-verify';
    await testConnection('URL with sslmode=no-verify', { connectionString: urlWithNoVerify });

})();
