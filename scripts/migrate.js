#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const databaseDir = path.join(__dirname, '..', 'database');

if (!fs.existsSync(databaseDir)) {
    console.error('[migrate] database directory not found:', databaseDir);
    process.exit(1);
}

const sqlFiles = fs
    .readdirSync(databaseDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

if (sqlFiles.length === 0) {
    console.log('[migrate] No SQL migration files found. Nothing to run.');
    process.exit(0);
}

console.log('[migrate] Manual migration mode (Supabase-managed schema).');
console.log('[migrate] Execute these SQL files in Supabase SQL editor in order:');
sqlFiles.forEach((file, index) => {
    console.log(`${index + 1}. database/${file}`);
});

process.exit(0);
