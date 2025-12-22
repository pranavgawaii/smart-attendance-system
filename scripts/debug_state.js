const db = require('../src/config/db');

const checkState = async () => {
    try {
        console.log("--- DEBUGGING DATABASE STATE ---");

        // 1. Check Users
        const users = await db.query('SELECT id, name, email, role FROM users');
        console.log(`\n1. USERS (${users.rows.length}):`);
        users.rows.forEach(u => console.log(`   - [${u.role}] ${u.email} (ID: ${u.id})`));

        // 2. Check Events
        const events = await db.query('SELECT id, name, created_at FROM events ORDER BY created_at DESC LIMIT 5');
        console.log(`\n2. RECENT EVENTS (${events.rows.length}):`);
        events.rows.forEach(e => console.log(`   - [ID: ${e.id}] ${e.name}`));

        process.exit(0);
    } catch (error) {
        console.error("Debug failed:", error);
        process.exit(1);
    }
};

checkState();
