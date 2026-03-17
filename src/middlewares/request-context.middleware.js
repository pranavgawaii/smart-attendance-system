const crypto = require('crypto');

const REQUEST_ID_HEADER = 'x-request-id';

const attachRequestContext = (req, res, next) => {
    const incoming = req.headers[REQUEST_ID_HEADER];
    const requestId = typeof incoming === 'string' && incoming.trim()
        ? incoming.trim()
        : crypto.randomUUID();

    req.requestId = requestId;
    req.requestStartAt = Date.now();
    res.setHeader('X-Request-Id', requestId);
    return next();
};

const requestLogger = (req, res, next) => {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
        const elapsedMs = Number(process.hrtime.bigint() - start) / 1_000_000;
        const message = `[${new Date().toISOString()}] [${req.requestId || 'n/a'}] ${req.method} ${req.originalUrl} ${res.statusCode} ${elapsedMs.toFixed(1)}ms`;

        if (res.statusCode >= 500) {
            console.error(message);
            return;
        }

        if (res.statusCode >= 400) {
            console.warn(message);
            return;
        }

        console.log(message);
    });

    return next();
};

module.exports = {
    attachRequestContext,
    requestLogger
};
