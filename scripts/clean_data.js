const db = require('../src/config/db');

const cleanData = async () => {
    try {
        console.log("Cleaning student data...");

        // 1. Delete all attendance logs
        await db.query('DELETE FROM attendance_logs');
        console.log("- Deleted all attendance logs.");

        // 2. Delete all users who are NOT admins
        // Assuming 'admin' role or email keywords
        await db.query("DELETE FROM users WHERE role != 'admin'");
        console.log("- Deleted all student accounts.");

        console.log("Cleanup complete.");
        process.exit(0);
    } catch (error) {
        console.error("Cleanup failed:", error);
        process.exit(1);
    }
};

cleanData();
