const qrModel = require('../models/qr.model');
const eventModel = require('../models/event.model');

// Map: eventId -> intervalId
const activeIntervals = new Map();

const generateToken = async (eventId, intervalSeconds) => {
    try {
        // 1. Generate unique token (for QR) and simple code (for manual)
        // Token: Complex random string + timestamp
        const token = require('crypto').randomBytes(16).toString('hex');

        // Code: 6-digit number
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        const expiresAt = new Date(Date.now() + (intervalSeconds * 1000) + 5000).toISOString(); // +5s buffer

        // 2. Persist to DB
        await qrModel.createToken({
            session_id: eventId,
            token: token,
            code: code,
            expires_at: expiresAt
        });

        // 3. Update Event's current display info (optional, for fast access without join)
        // await eventModel.updateCurrentToken(eventId, token); 

        console.log(`[QR Service] Refreshed QR for Event ${eventId} (Code: ${code})`);
        return { token, code };

    } catch (error) {
        console.error(`[QR Service] Error generating token for event ${eventId}:`, error.message);
        stopRotation(eventId);
    }
};

const startRotation = async (eventId, intervalSeconds) => {
    stopRotation(eventId); // Stop existing

    try {
        const event = await eventModel.findById(eventId);
        if (!event || event.session_state !== 'ACTIVE') {
            console.warn(`[QR Service] Event ${eventId} not active. Skipping rotation.`);
            return;
        }

        console.log(`[QR Service] Starting rotation for Event ${eventId} (${intervalSeconds}s interval)`);

        // Immediate first generation
        await generateToken(eventId, intervalSeconds);

        const intervalId = setInterval(() => {
            generateToken(eventId, intervalSeconds);
        }, intervalSeconds * 1000);

        activeIntervals.set(String(eventId), intervalId);

    } catch (err) {
        console.error(`[QR Service] Failed to start rotation: ${err.message}`);
    }
};

const stopRotation = (eventId) => {
    const id = String(eventId);
    if (activeIntervals.has(id)) {
        clearInterval(activeIntervals.get(id));
        activeIntervals.delete(id);
        console.log(`[QR Service] Stopped rotation for Event ${id}`);
    }
};

module.exports = {
    startRotation,
    stopRotation
};
