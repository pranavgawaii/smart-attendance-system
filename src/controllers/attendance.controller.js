const crypto = require('crypto');
const attendanceModel = require('../models/attendance.model');
const qrModel = require('../models/qr.model');
const userModel = require('../models/user.model');
const eventModel = require('../models/event.model');
const auditStore = require('../utils/auditStore');

const logAttendance = async (req, res) => {
    try {
        let { event_id, token, fingerprint, device_info } = req.body;
        const user_id = req.user.id; // From Auth Middleware

        // 1. Validate Input
        if (!event_id) return res.status(400).json({ error: 'Event ID required' });
        if (!fingerprint) return res.status(400).json({ error: 'Device fingerprint required' });

        // 2. Resolve Event (UUID vs Display ID)
        let event = null;
        if (event_id.length < 10) { // Assume Short Display ID
            event = await eventModel.findByDisplayId(event_id);
            if (event) {
                // IMPORTANT: Swap the short ID with the real UUID for subsequent logic
                event_id = event.id;
            }
        } else {
            event = await eventModel.findById(event_id);
        }

        if (!event) return res.status(404).json({ error: 'Event not found' });

        // 3. Check Session State
        if (event.session_state !== 'ACTIVE') {
            return res.status(403).json({ error: `Session is ${event.session_state}. Attendance closed.` });
        }

        const user = await userModel.findById(user_id);
        if (!user || !user.enrollment_no) return res.status(403).json({ error: 'Profile incomplete. Please update enrollment number.' });

        // 4. Verify Token (if provided - Manual Code or QR)
        // Note: 'token' here might be the 6-digit Code if manual entry
        if (token) {
            const validToken = await qrModel.findByToken(event_id, token);
            if (!validToken) return res.status(400).json({ error: 'Invalid or expired code' });
        }

        // 5. Check Duplicate Attendance
        const existing = await attendanceModel.findByUserAndEvent(user_id, event_id);
        if (existing) {
            return res.status(200).json({ message: 'Attendance already marked', data: existing });
        }

        // 6. Device Fingerprint (Proxy Check)
        const deviceUsedBy = await attendanceModel.checkDeviceUsed(event_id, fingerprint);
        if (deviceUsedBy && deviceUsedBy.user_id !== user_id) {
            // Log Attempt
            await attendanceModel.logProxyAttempt({
                session_id: event_id,
                student_email: user.email,
                original_fingerprint: deviceUsedBy.device_fingerprint || 'unknown',
                attempted_fingerprint: fingerprint
            });

            return res.status(403).json({
                error: 'Device mismatch. This device has already been used by another student.',
                code: 'PROXY_DETECTED'
            });
        }

        // 7. Log Attendance
        const log = await attendanceModel.logAttendance({
            session_id: event_id,
            student_email: user.email,
            student_name: user.name,
            enrollment_no: user.enrollment_no,
            device_fingerprint: fingerprint,
            scan_method: token ? (token.length === 6 ? 'MANUAL' : 'QR') : 'UNKNOWN',
            user_id: user.id
        });

        if (!log) return res.status(409).json({ error: 'Attendance already marked' });

        res.status(200).json({ message: 'Attendance marked successfully', data: log });

    } catch (error) {
        console.error('[Attendance] Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ... keep other exports ...
const getMyHistory = async (req, res) => {
    try {
        const user_id = req.user.id;
        const history = await attendanceModel.findByUser(user_id);
        res.status(200).json(history || []);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateStatus = async (req, res) => { res.json({}); };
const getAllAttendance = async (req, res) => { res.json([]); };

module.exports = {
    logAttendance,
    getMyHistory,
    updateStatus,
    getAllAttendance
};
