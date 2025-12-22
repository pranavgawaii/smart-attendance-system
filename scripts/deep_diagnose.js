const db = require('../src/config/db');

const diagnose = async () => {
    try {
        console.log("=== DEEP DIAGNOSTIC START ===");

        // 1. INSPECT TABLE COLUMNS
        console.log("\n[1] Checking Schema...");
        const tableQuery = `
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            ORDER BY table_name, ordinal_position;
        `;
        const schema = await db.query(tableQuery);
        schema.rows.forEach(r => console.log(`${r.table_name}.${r.column_name} (${r.data_type})`));

        // 2. TEST USER INSERT
        console.log("\n[2] Testing User Insert...");
        try {
            const userRes = await db.query(`
                INSERT INTO users (name, email, role, enrollment_no, branch) 
                VALUES ('Test User', 'test_diag@example.com', 'student', 'DIAG001', 'CS') 
                RETURNING *
            `);
            console.log("✅ User Insert Success:", userRes.rows[0].id);
            // Cleanup
            await db.query(`DELETE FROM users WHERE email = 'test_diag@example.com'`);
        } catch (e) {
            console.error("❌ User Insert FAILED:", e.message);
        }

        // 3. TEST EVENT INSERT
        console.log("\n[3] Testing Event Insert...");
        try {
            const eventRes = await db.query(`
                INSERT INTO events (name, qr_refresh_interval) 
                VALUES ('Diagnostic Event', 15) 
                RETURNING *
            `);
            console.log("✅ Event Insert Success:", eventRes.rows[0].id);
            // Cleanup
            await db.query(`DELETE FROM events WHERE id = ${eventRes.rows[0].id}`);
        } catch (e) {
            console.error("❌ Event Insert FAILED:", e.message);
        }

        console.log("\n=== DIAGNOSTIC COMPLETE ===");
        process.exit(0);

    } catch (error) {
        console.error("Diagnostic Script Error:", error);
        process.exit(1);
    }
};

diagnose();
