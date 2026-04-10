const db = require('../config/db');

const fixDb = async () => {
    try {
        console.log('Checking database table: otp_tokens...');

        await db.query(`
            CREATE TABLE IF NOT EXISTS otp_tokens (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                otp_hash VARCHAR(255) NOT NULL,
                dev_otp VARCHAR(10),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL
            );
        `);

        console.log('✅ Table "otp_tokens" verified/created.');

        console.log('Checking database table: attendance_logs...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS attendance_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                event_id INTEGER REFERENCES events(id),
                qr_session_id INTEGER,
                device_hash VARCHAR(255),
                status VARCHAR(50) DEFAULT 'ENTRY',
                scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Table "attendance_logs" verified/created.');

        console.log('Database fix complete.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Database Fix Failed:', err);
        process.exit(1);
    }
};

fixDb();
