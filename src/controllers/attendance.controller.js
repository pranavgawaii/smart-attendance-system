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

    // Create a unique string from components
    const fingerprint = components.join('|');

    // Hash it
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
};

const logAttendance = async (req, res) => {
    try {
        const { event_id, token } = req.body;

        // 1. Generate Secure Device Hash
        const device_hash = generateDeviceHash(req);

        const user_id = req.user.id;
        const user = await userModel.findById(user_id);

        if (!user) return res.status(401).json({ error: 'User not found' });
        if (!user.enrollment_no) return res.status(403).json({ error: 'Profile incomplete' });

        // 2. FETCH EVENT DETAILS
        const event = await eventModel.findById(event_id);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        const session_state = event.session_state || 'NOT_STARTED';

        // 3. CHECK SESSION STATE
        if (session_state !== 'ACTIVE') {
            return res.status(400).json({ error: 'Attendance not open yet or session stopped.' });
        }

        // 4. CHECK EXISTING ATTENDANCE
        const existingLog = await attendanceModel.findByUserAndEvent(user_id, event_id);

        if (existingLog) {
            return res.status(409).json({ error: 'Attendance already marked for this session.' });
        }

        // 5. CHECK DEVICE USAGE (STRICT anti-proxy)
        const deviceUser = await attendanceModel.checkDeviceUsed(event_id, device_hash);
        if (deviceUser && deviceUser !== user_id) {
            // Device used by someone else -> BLOCK ALWAYS
            auditStore.addAlert(event_id, device_hash);
            // DEMO MODE: ALLOW REUSE
            console.log(`[DEMO] Device reuse allowed: ${device_hash}`);
            // return res.status(409).json({ error: 'Attendance already marked from this device' });
        }

        // 6. VALIDATE TOKEN & LOG ATTENDANCE
        // Validate Token
        const session = await qrModel.findValidSession(token);
        if (!session || session.event_id != event_id) return res.status(400).json({ error: 'Invalid QR' });

        const log = await attendanceModel.logAttendance({
            user_id,
            event_id,
            qr_session_id: session.id,
            device_hash,
            status: 'PRESENT' // Single status
        });
        return res.status(201).json({ message: 'Attendance Marked Successfully', log });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
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
