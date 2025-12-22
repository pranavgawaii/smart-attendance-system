const db = require('../src/config/db');

const forceMigration = async () => {
    try {
        console.log("Running FORCED migration...");

        // Use standard POSTGRES syntax which is more reliable
        await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);`);
        await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS enrollment_no VARCHAR(255) UNIQUE;`);
        await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS branch VARCHAR(50);`);

        console.log("Forced Migration complete: Columns ensure.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

forceMigration();
