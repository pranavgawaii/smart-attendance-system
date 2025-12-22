const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const run = async () => {
    // Parse DATABASE_URL to get credentials, but connect to 'postgres' db first
    const dbUrl = process.env.DATABASE_URL;
    const urlParts = new URL(dbUrl);
    const targetDb = urlParts.pathname.split('/')[1];

    // Connect to default 'postgres' database
    urlParts.pathname = '/postgres';
    const postgresClient = new Client({ connectionString: urlParts.toString() });

    try {
        await postgresClient.connect();
        console.log('Connected to postgres database');

        // Check if target db exists
        const res = await postgresClient.query(`SELECT 1 FROM pg_database WHERE datname = '${targetDb}'`);
        if (res.rowCount === 0) {
            console.log(`Creating database ${targetDb}...`);
            await postgresClient.query(`CREATE DATABASE "${targetDb}"`);
            console.log(`Database ${targetDb} created.`);
        } else {
            console.log(`Database ${targetDb} already exists.`);
        }
    } catch (err) {
        console.error('Error creating database:', err);
    } finally {
        await postgresClient.end();
    }

    // Now connect to the target database and run init.sql
    const targetClient = new Client({ connectionString: dbUrl });
    try {
        await targetClient.connect();
        console.log(`Connected to ${targetDb}`);

        const sqlPath = path.join(__dirname, '../database/init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running init.sql...');
        await targetClient.query(sql);
        console.log('Schema initialized successfully.');
    } catch (err) {
        console.error('Error initializing schema:', err);
    } finally {
        await targetClient.end();
    }
};

run();
