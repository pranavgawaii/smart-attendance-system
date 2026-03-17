require('dotenv').config();
const { logRuntimeIssues } = require('./config/runtime');
const app = require('./app');

const PORT = process.env.PORT || 3000;
logRuntimeIssues('server');

// Validate required environment variables (warn but don't crash in serverless)
if (!process.env.ADMIN_EMAIL) {
    console.warn('⚠️  WARNING: ADMIN_EMAIL is not configured in environment variables');
    console.warn('Some admin features may not work correctly');
}

// Only start the server and background tasks if running directly (local or non-serverless)
if (require.main === module) {
    const server = app.listen(PORT, async () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log("✅ Connected to Supabase backend");
        console.log('✅ QR generation runs on deterministic slot model (no in-memory rotation timers).');
    });

    // Graceful shutdown logic (only for persistent servers)
    if (!process.env.VERCEL) {
        const gracefulShutdown = async (signal) => {
            console.log(`\n${signal} received. Closing server gracefully...`);

            if (server) {
                server.close(async () => {
                    console.log('HTTP server closed');
                    console.log('Backend connection closed');
                    process.exit(0);
                });
            } else {
                process.exit(0);
            }

            // Force shutdown after 10 seconds
            setTimeout(() => {
                console.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
}

// Export the app for Vercel serverless
module.exports = app;
