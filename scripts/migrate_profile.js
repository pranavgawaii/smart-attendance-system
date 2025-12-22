const db = require('../src/config/db');

const runMigration = async () => {
    try {
        console.log("Running migration...");

        // Add name if not exists (usually exists)
        await db.query(`DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='name') THEN 
                    ALTER TABLE users ADD COLUMN name VARCHAR(255); 
                END IF; 
            END $$;`);

        // Add enrollment_no
        await db.query(`DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='enrollment_no') THEN 
                    ALTER TABLE users ADD COLUMN enrollment_no VARCHAR(255) UNIQUE; 
                END IF; 
            END $$;`);

        // Add branch
        await db.query(`DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='branch') THEN 
                    ALTER TABLE users ADD COLUMN branch VARCHAR(50); 
                END IF; 
            END $$;`);

        console.log("Migration complete: Added fields to users table.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

runMigration();
