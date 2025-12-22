const db = require('../src/config/db');

const fixEvents = async () => {
    try {
        console.log("Fixing Events Schema...");

        // 1. Rename title -> name
        await db.query(`
            DO $$
            BEGIN
                IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='title') THEN
                    ALTER TABLE events RENAME COLUMN title TO name;
                END IF;
            END $$;
        `);

        // 2. Make other fields optional if they aren't already
        await db.query(`ALTER TABLE events ALTER COLUMN venue DROP NOT NULL`);
        await db.query(`ALTER TABLE events ALTER COLUMN created_by DROP NOT NULL`);
        await db.query(`ALTER TABLE events ALTER COLUMN start_time DROP NOT NULL`);
        await db.query(`ALTER TABLE events ALTER COLUMN end_time DROP NOT NULL`);

        console.log("Events Schema Fixed.");
        process.exit(0);
    } catch (error) {
        console.error("Fix failed:", error);
        process.exit(1);
    }
};

fixEvents();
