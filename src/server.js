const app = require('./app');
// Trigger restart
const { pool } = require('./config/db');
require('dotenv').config();
const eventModel = require('./models/event.model');
const qrService = require('./services/qr.service');
const qrModel = require('./models/qr.model');

const PORT = process.env.PORT || 3000;

// Validate required environment variables
if (!process.env.ADMIN_EMAIL) {
    console.error('❌ FATAL ERROR: ADMIN_EMAIL is not configured in environment variables');
    console.error('Please set ADMIN_EMAIL in your .env file');
    process.exit(1);
}


const resumeActiveSessions = async () => {
    try {
        console.log("🔄 Checking for active sessions to resume...");
        const events = await eventModel.findAll();
        const activeEvents = events.filter(e => e.session_state === 'ACTIVE');

        for (const event of activeEvents) {
            console.log(`▶️ Resuming session for Event: ${event.name} (${event.id})`);
            // Default to 10s if null
            await qrService.startRotation(event.id, event.qr_refresh_interval || 10);
        }

        if (activeEvents.length === 0) console.log("✅ No active sessions found.");

    } catch (err) {
        // Check if error is due to missing tables (fresh database)
        if (err.message && err.message.includes('relation') && err.message.includes('does not exist')) {
            console.log("⚠️  Database tables not yet created.");
            console.log("ℹ️  Run 'node scripts/setup-db.js' to initialize the database schema.");
        } else {
            console.error("❌ Failed to resume sessions:", err.message);
        }
    }
};


// EMERGENCY MIGRATION ROUTE
// TODO: Remove after fixing production DB
const { createMissingTables } = require('../scripts/create_missing_tables');
app.get('/api/migrate/emergency', async (req, res) => {
    try {
        console.log('🚨 Triggering emergency migration...');
        await createMissingTables();
        res.status(200).json({
            success: true,
            message: 'Database migration completed successfully! All missing tables created.'
        });
    } catch (error) {
        console.error('Migration failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

const server = app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    console.log("⚠️  SERVER RUNNING IN OFFLINE / MOCK MODE (Database Disconnected) ⚠️");

    // Clean up any orphaned sessions from before (e.g. if DB constraint failed)
    // await qrModel.cleanupOrphanedSessions();

    // Resume active QR sessions
    // await resumeActiveSessions();
});

// Graceful shutdown for Railway deployments
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Closing server gracefully...`);

    server.close(async () => {
        console.log('HTTP server closed');

        try {
            await pool.end();
            console.log('Database pool closed');
            process.exit(0);
        } catch (err) {
            console.error('Error closing database pool:', err);
            process.exit(1);
        }
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

