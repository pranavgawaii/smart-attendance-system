require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const requiredProdEnv = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'QR_HMAC_SECRET'
];

const missingProdEnv = requiredProdEnv.filter((name) => !process.env[name]);
if (isProduction && missingProdEnv.length > 0) {
    throw new Error(
        `[Startup] Missing required environment variables in production: ${missingProdEnv.join(', ')}`
    );
}

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
