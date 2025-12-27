const crypto = require('crypto');
const attendanceModel = require('../models/attendance.model');
const qrModel = require('../models/qr.model');
const userModel = require('../models/user.model');
const auditStore = require('../utils/auditStore');
const eventModel = require('../models/event.model');

const generateDeviceHash = (req) => {
    const components = [
        req.headers['user-agent'] || '',
        req.headers['x-platform'] || req.headers['sec-ch-ua-platform'] || '',
        req.headers['x-screen-resolution'] || '',
        req.headers['x-timezone'] || ''
    ];

    console.log('[DEBUG] Device components:', components);

    // Create a unique string from components
    const fingerprint = components.join('|');

    // Hash it
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
};

const logAttendance = async (req, res) => {
    try {
        console.log('[Attendance] Request received:', { event_id: req.body.event_id, has_token: !!req.body.token, user_id: req.user?.id });

        const { event_id, token } = req.body;

        // 1. Generate Secure Device Hash
        const device_hash = generateDeviceHash(req);
        console.log(`[DEBUG] Generated Hash: ${device_hash.substring(0, 10)}... for User: ${req.user.id}`);

        const user_id = req.user.id;
        const user = await userModel.findById(user_id);
        console.log('[Attendance] User found:', { user_id, has_user: !!user, enrollment: user?.enrollment_no });

        if (!user) return res.status(401).json({ error: 'User not found' });
        if (!user.enrollment_no) return res.status(403).json({ error: 'Profile incomplete' });

        // 2. FETCH EVENT DETAILS
        const event = await eventModel.findById(event_id);
        console.log('[Attendance] Event found:', { event_id, has_event: !!event, state: event?.session_state });

        if (!event) return res.status(404).json({ error: 'Event not found' });

        const session_state = event.session_state || 'NOT_STARTED';

        // 3. CHECK SESSION STATE
        if (session_state !== 'ACTIVE') {
            console.log('[Attendance] Session not active:', session_state);
            return res.status(400).json({ error: 'Attendance not open yet or session stopped.' });
        }

        // 4. CHECK EXISTING ATTENDANCE
        const existingLog = await attendanceModel.findByUserAndEvent(user_id, event_id);

        if (existingLog) {
            console.log('[Attendance] Duplicate attendance attempt');
            return res.status(409).json({ error: 'Attendance already marked for this event.' });
        }

        // 5. VERIFY TOKEN IF PROVIDED
        if (token) {
            console.log('[Attendance] Verifying QR token');
            const isValid = await qrModel.verifyToken(event_id, token);
            if (!isValid) {
                console.log('[Attendance] Invalid/expired token');
                return res.status(400).json({ error: 'Invalid or expired QR code.' });
            }
        }

        // 6. DEVICE LOCK CHECK
        // FIX: Use checkDeviceUsed from model (args: event_id, device_hash) which returns user_id or null
        const lockedUserId = await attendanceModel.checkDeviceUsed(event_id, device_hash);
        if (lockedUserId && lockedUserId != user_id) { // Use != for loose equality safety
            console.warn(`[Attendance] 🛑 Device Lock Triggered!`);
            console.warn(`   Event: ${event_id}`);
            console.warn(`   Device Hash: ${device_hash}`);
            console.warn(`   Locked By User: ${lockedUserId}`);
            console.warn(`   Current User: ${user_id}`);

            // WARN instead of BLOCK (Soft Lock for testing/lab usage)
            console.warn(`[Attendance] ⚠️ Device Lock bypass allowed. Proceeding...`);

            // return res.status(403).json({
            //     error: 'This device has already been used to mark attendance for this event by another student.'
            // });
        }

        // 7. LOG ATTENDANCE
        console.log('[Attendance] Logging attendance...');
        // FIX: qrModel functions are now safe
        const qrSession = token ? await qrModel.getSessionByToken(event_id, token) : null;

        // FIX: logAttendance expects an OBJECT as argument
        await attendanceModel.logAttendance({
            user_id,
            event_id,
            qr_session_id: qrSession ? qrSession.id : null,
            device_hash
        });

        // 8. AUDIT LOG (Non-blocking)
        try {
            auditStore.log({
                action: 'ATTENDANCE_MARKED',
                user_id,
                event_id,
                method: token ? 'QR_SCAN' : 'MANUAL',
                device_hash
            });
        } catch (auditErr) {
            console.error('[Audit] Failed to log audit:', auditErr);
            // Do not fail the request
        }

        console.log('[Attendance] Success!');
        res.status(200).json({ message: 'Attendance marked successfully' });

    } catch (error) {
        // FIX: Production safe error logging (no stack trace leak)
        console.error('[Attendance] ERROR:', error.message);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

const getMyHistory = async (req, res) => {
    try {
        const user_id = req.user.id;
        const history = await attendanceModel.findByUser(user_id);

        // Ensure we always return an array, even if empty
        res.status(200).json(history || []);
    } catch (error) {
        console.error('Error fetching attendance history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['PRESENT', 'ABSENT', 'REVOKED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updated = await attendanceModel.updateStatus(id, status);
        if (!updated) return res.status(404).json({ error: 'Attendance record not found' });

        res.json(updated);
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getAllAttendance = async (req, res) => {
    try {
        const logs = await attendanceModel.findAllLogs();
        res.json(logs);
    } catch (error) {
        console.error('Error fetching global attendance:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    logAttendance,
    getMyHistory,
    updateStatus,
    getAllAttendance
};
