const toNonNegativeInteger = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const getClientIp = (req) => {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
        return forwardedFor.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || 'unknown';
};

const createRateLimiter = ({
    windowMs,
    max,
    code = 'RATE_LIMIT_EXCEEDED',
    error = 'Too many requests. Please try again later.',
    keyGenerator,
    skip
}) => {
    const store = new Map();
    const intervalMs = toNonNegativeInteger(windowMs, 60_000);
    const maxRequests = toNonNegativeInteger(max, 60);

    const cleanupTimer = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store.entries()) {
            if (entry.resetAt <= now) {
                store.delete(key);
            }
        }
    }, Math.min(intervalMs, 60_000));
    cleanupTimer.unref?.();

    return (req, res, next) => {
        if (typeof skip === 'function' && skip(req)) {
            return next();
        }

        const now = Date.now();
        const key = String(
            (typeof keyGenerator === 'function' ? keyGenerator(req) : null) || getClientIp(req)
        );

        const current = store.get(key);
        if (!current || current.resetAt <= now) {
            store.set(key, { count: 1, resetAt: now + intervalMs });
            return next();
        }

        if (current.count >= maxRequests) {
            const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
            res.setHeader('Retry-After', retryAfterSeconds);
            return res.status(429).json({
                success: false,
                code,
                error,
                details: {
                    retry_after_seconds: retryAfterSeconds
                }
            });
        }

        current.count += 1;
        return next();
    };
};

const authRateLimiter = createRateLimiter({
    windowMs: toNonNegativeInteger(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60_000),
    max: toNonNegativeInteger(process.env.AUTH_RATE_LIMIT_MAX, 40),
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    error: 'Too many authentication attempts. Please try again later.'
});

const attendanceRateLimiter = createRateLimiter({
    windowMs: toNonNegativeInteger(process.env.ATTENDANCE_RATE_LIMIT_WINDOW_MS, 60_000),
    max: toNonNegativeInteger(process.env.ATTENDANCE_RATE_LIMIT_MAX, 120),
    code: 'ATTENDANCE_RATE_LIMIT_EXCEEDED',
    error: 'Too many attendance requests. Please wait and try again.'
});

const publicFormSubmitRateLimiter = createRateLimiter({
    windowMs: toNonNegativeInteger(process.env.PUBLIC_FORM_RATE_LIMIT_WINDOW_MS, 10 * 60_000),
    max: toNonNegativeInteger(process.env.PUBLIC_FORM_RATE_LIMIT_MAX, 20),
    code: 'FORM_RATE_LIMIT_EXCEEDED',
    error: 'Too many submissions from this network. Please try again later.',
    keyGenerator: (req) => `${getClientIp(req)}:${String(req.params?.slug || '')}`
});

module.exports = {
    createRateLimiter,
    authRateLimiter,
    attendanceRateLimiter,
    publicFormSubmitRateLimiter
};
