require('dotenv').config();
const app = require('./app');
const { supabase } = require('./config/db');
const eventModel = require('./models/event.model');
const qrService = require('./services/qr.service');
const qrModel = require('./models/qr.model');

// Add new route imports
const healthRoutes = require('./routes/health.routes'); // Assuming this exists based on the instruction's app.use
const authRoutes = require('./routes/auth.routes'); // Assuming this exists
const qrRoutes = require('./routes/qr.routes'); // Assuming this exists
const eventRoutes = require('./routes/event.routes'); // Assuming this exists
const attendanceRoutes = require('./routes/attendance.routes'); // Assuming this exists
const userRoutes = require('./routes/user.routes'); // Assuming this exists
const studentRoutes = require('./routes/student.routes'); // Assuming this exists
const assessmentRoutes = require('./routes/assessment.routes');
const labRoutes = require('./routes/lab.routes');
const labsRoutes = require('./routes/labs.routes');
const placementRoutes = require('./routes/placement.routes');
const adminManagementRoutes = require('./routes/admin-management.routes');

const PORT = process.env.PORT || 3000;

// Validate required environment variables (warn but don't crash in serverless)
if (!process.env.ADMIN_EMAIL) {
    console.warn('⚠️  WARNING: ADMIN_EMAIL is not configured in environment variables');
    console.warn('Some admin features may not work correctly');
}

// Routes are handled in app.js

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

// Only start the server if running directly (not imported as a module)
if (require.main === module) {
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

    // Graceful shutdown logic remains here within the conditional block
    const gracefulShutdown = async (signal) => {
        console.log(`\n${signal} received. Closing server gracefully...`);

        server.close(async () => {
            console.log('HTTP server closed');
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
}

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

// Export the app for Vercel serverless
module.exports = app;
