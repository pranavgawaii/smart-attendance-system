const isProduction = process.env.NODE_ENV === 'production';
const isServerless = Boolean(process.env.VERCEL);
const requiredRuntimeEnv = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'QR_HMAC_SECRET'
];

const shouldFailFast = isProduction && !isServerless;

const getMissingRuntimeEnv = () => requiredRuntimeEnv.filter((name) => !process.env[name]?.trim());

const logRuntimeIssues = (source) => {
    const missingRuntimeEnv = getMissingRuntimeEnv();

    if (missingRuntimeEnv.length === 0) {
        return;
    }

    const prefix = source ? `[Startup:${source}]` : '[Startup]';
    const message = `${prefix} Missing required environment variables: ${missingRuntimeEnv.join(', ')}`;

    if (shouldFailFast) {
        throw new Error(message);
    }

    console.error(`${message}. Running in degraded mode.`);
};

module.exports = {
    isProduction,
    isServerless,
    shouldFailFast,
    requiredRuntimeEnv,
    getMissingRuntimeEnv,
    logRuntimeIssues
};
