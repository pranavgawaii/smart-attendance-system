const { pool } = require('../src/config/db');

const migrateUsers = async () => {
    try {
        console.log('🔄 Starting User Management Migration...');

        // 1. Add academic_year column
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS academic_year INTEGER DEFAULT NULL;
        `);
        console.log('✅ Added academic_year column');

        // 2. Add user_status column
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS user_status VARCHAR(20) DEFAULT 'active';
        `);
        console.log('✅ Added user_status column');

        // 3. Update existing students to default values (e.g., Active)
        // We won't set academic_year yet as we don't know it, but status should be active.
        await pool.query(`
            UPDATE users 
            SET user_status = 'active' 
            WHERE user_status IS NULL;
        `);
        console.log('✅ Updated existing users to active status');

        console.log('🚀 Migration Complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration Failed:', err);
        process.exit(1);
    }
};

migrateUsers();
