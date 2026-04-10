const crypto = require('crypto');

const DEFAULT_INTERVAL_SECONDS = 10;
const EXPIRY_BUFFER_MS = 5000;

const resolveIntervalSeconds = (value) => Math.max(Number(value) || DEFAULT_INTERVAL_SECONDS, 1);

const getSlotNumber = (atMs, intervalSeconds) => {
    const intervalMs = resolveIntervalSeconds(intervalSeconds) * 1000;
    return Math.floor(Number(atMs) / intervalMs);
};

const getSecret = () => {
    const secret = process.env.QR_HMAC_SECRET?.trim();
    if (!secret) {
        throw new Error('QR_HMAC_SECRET is required for QR token generation.');
    }
    return secret;
};

const deriveDigest = (sessionId, slot) => {
    const hmac = crypto.createHmac('sha256', getSecret());
    hmac.update(`${String(sessionId)}:${String(slot)}`);
    return hmac.digest('hex');
};

const buildTokenFromSlot = (sessionId, intervalSeconds, slot) => {
    const effectiveInterval = resolveIntervalSeconds(intervalSeconds);
    const intervalMs = effectiveInterval * 1000;
    const digest = deriveDigest(sessionId, slot);

    const codeBase = parseInt(digest.slice(0, 8), 16);
    const code = ((codeBase % 900000) + 100000).toString();

    const slotStartMs = slot * intervalMs;
    const generatedAt = new Date(slotStartMs).toISOString();
    const expiresAt = new Date(slotStartMs + intervalMs + EXPIRY_BUFFER_MS).toISOString();

    return {
        token: digest.slice(0, 32),
        code,
        generated_at: generatedAt,
        expires_at: expiresAt,
        slot
    };
};

const getTokenForTime = (sessionId, intervalSeconds, atMs = Date.now()) => {
    const slot = getSlotNumber(atMs, intervalSeconds);
    return buildTokenFromSlot(sessionId, intervalSeconds, slot);
};

const getTokenWindow = (sessionId, intervalSeconds, atMs = Date.now(), slotsBack = 1) => {
    const currentSlot = getSlotNumber(atMs, intervalSeconds);
    const window = [];

    for (let offset = 0; offset <= Math.max(0, Number(slotsBack) || 0); offset += 1) {
        window.push(buildTokenFromSlot(sessionId, intervalSeconds, currentSlot - offset));
    }

    return window;
};

// Legacy compatibility methods retained for callers; timers are intentionally disabled.
const startRotation = async (eventId, intervalSeconds) => {
    return getTokenForTime(eventId, intervalSeconds);
};

const stopRotation = () => {
    return true;
};

module.exports = {
    startRotation,
    stopRotation,
    getTokenForTime,
    getTokenWindow,
    resolveIntervalSeconds
};
