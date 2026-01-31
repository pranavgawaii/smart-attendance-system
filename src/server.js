require('dotenv').config();
const app = require('./app');
const { supabase } = require('./config/db');
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
        console.log("🔄 Checking for active sessions to resume (Supabase)...");
        const events = await eventModel.findAll();
        const activeEvents = events.filter(e => e.session_state === 'ACTIVE');

        for (const event of activeEvents) {
            console.log(`▶️ Resuming session for Event: ${event.name} (${event.id})`);
            // Default to 10s if null
            await qrService.startRotation(event.id, event.qr_refresh_interval || 10);
        }

        if (activeEvents.length === 0) console.log("✅ No active sessions found.");

    } catch (err) {
        console.error("❌ Failed to resume sessions:", err.message);
    }
};

const server = app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log("✅ Connected to Supabase backend");

    try {
        // Clean up any orphaned sessions from before
        await qrModel.cleanupOrphanedSessions();

        // Resume active QR sessions
        await resumeActiveSessions();
    } catch (err) {
        console.error("❌ Error during server startup initialization:", err.message);
    }
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Closing server gracefully...`);

    server.close(async () => {
        console.log('HTTP server closed');
        // Supabase client doesn't need explicit "end()" or "close()" like pg pool
        console.log('Backend connection closed');
        process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
