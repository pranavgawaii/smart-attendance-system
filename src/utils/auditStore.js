const auditAlerts = new Map(); // event_id -> [alerts]
const MAX_ALERTS = 5;

const addAlert = (eventIdOrObj, deviceHash) => {
    // Overload support: Handle ({ action, event_id, ... }) or (eventId, deviceHash)
    let eventId = eventIdOrObj;
    let type = 'BLOCKED_PROXY';
    let details = {};

    if (typeof eventIdOrObj === 'object') {
        eventId = eventIdOrObj.event_id;
        type = eventIdOrObj.action || 'GENERAL_ALERT';
        details = eventIdOrObj;
    }

    if (!auditAlerts.has(eventId)) {
        auditAlerts.set(eventId, []);
    }

    const alerts = auditAlerts.get(eventId);
    const safeHash = (deviceHash || details.device_hash || 'UNKNOWN');
    const partialHash = safeHash.length > 4 ? safeHash.slice(-4).toUpperCase() : safeHash;

    const newAlert = {
        scan_time: new Date(),
        device_id: partialHash,
        type: type,
        details: details
    };

    alerts.unshift(newAlert);

    // Keep only last 5
    if (alerts.length > MAX_ALERTS) {
        alerts.pop();
    }
};

const getAlerts = (eventId) => {
    return auditAlerts.get(Number(eventId)) || []; // Ensure ID type match
};

module.exports = {
    addAlert,
    log: addAlert, // Alias for backward compatibility
    getAlerts
};
