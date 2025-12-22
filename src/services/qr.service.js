const crypto = require('crypto');
const qrModel = require('../models/qr.model');

// Map to store active rotation intervals: eventId -> intervalId
const activeIntervals = new Map();

const generateToken = async (eventId, intervalSeconds) => {
    try {
        // Generate 6-digit numeric token for easy typing
        const token = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + (intervalSeconds * 1000) + 5000); // +5s buffer

        await qrModel.createSession({
            event_id: eventId,
            token: token,
            expires_at: expiresAt
        });
        console.log(`[QR Service] Generated token for event ${eventId}`);
    } catch (error) {
        console.error(`[QR Service] Error generating token for event ${eventId}:`, error);
    }
};

const startRotation = async (eventId, intervalSeconds) => {
    stopRotation(eventId); // Clear existing if any

    console.log(`[QR Service] Starting rotation for event ${eventId} every ${intervalSeconds}s`);

    // Generate first token immediately
    await generateToken(eventId, intervalSeconds);

    const intervalId = setInterval(() => {
        generateToken(eventId, intervalSeconds);
    }, intervalSeconds * 1000);

    activeIntervals.set(Number(eventId), intervalId);
};

const stopRotation = (eventId) => {
    const id = Number(eventId);
    if (activeIntervals.has(id)) {
        clearInterval(activeIntervals.get(id));
        activeIntervals.delete(id);
        console.log(`[QR Service] Stopped rotation for event ${id}`);
    }
};

module.exports = {
    startRotation,
    stopRotation,
};
