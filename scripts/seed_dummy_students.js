const { pool } = require('../src/config/db');

const seedStudents = async () => {
    try {
        console.log('🌱 Starting Student Seeding...');

        const finalYearCount = 70;
        const thirdYearCount = 30;
        let insertedFY = 0;
        let insertedTY = 0;

        // Helper to pad numbers
        const pad = (num) => num.toString().padStart(4, '0'); // 0001
        const padName = (num) => num.toString().padStart(2, '0'); // 01

        console.log(`Processing ${finalYearCount} Final Year Students...`);
        for (let i = 1; i <= finalYearCount; i++) {
            const enrollment = `ADT23SOCB${pad(i)}`;
            const email = `adt23socb${pad(i)}@student.mitadt.edu`.toLowerCase();
            const name = `Student LY ${padName(i)}`;

            // Generate deterministic phone or other fields if needed, skipping for now

            // Check existence
            const check = await pool.query('SELECT id FROM users WHERE enrollment_no = $1', [enrollment]);
            if (check.rows.length === 0) {
                // Assuming status column exists based on context, if not we'll fallback
                await pool.query(
                    `INSERT INTO users (name, email, enrollment_no, branch, academic_year, role, user_status)
                     VALUES ($1, $2, $3, 'SOCB', 4, 'student', 'active')`,
                    [name, email, enrollment]
                );
                insertedFY++;
            }
        }

        console.log(`Processing ${thirdYearCount} Third Year Students...`);
        for (let i = 1; i <= thirdYearCount; i++) {
            const enrollment = `ADT24SOCB${pad(i)}`;
            const email = `adt24socb${pad(i)}@student.mitadt.edu`.toLowerCase();
            const name = `Student TY ${padName(i)}`;

            // Check existence
            const check = await pool.query('SELECT id FROM users WHERE enrollment_no = $1', [enrollment]);
            if (check.rows.length === 0) {
                await pool.query(
                    `INSERT INTO users (name, email, enrollment_no, branch, academic_year, role, user_status)
                     VALUES ($1, $2, $3, 'SOCB', 3, 'student', 'active')`,
                    [name, email, enrollment]
                );
                insertedTY++;
            }
        }

        console.log('-----------------------------------');
        console.log(`✅ Final Year inserted: ${insertedFY}`);
        console.log(`✅ Third Year inserted: ${insertedTY}`);
        console.log('-----------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
};

seedStudents();
