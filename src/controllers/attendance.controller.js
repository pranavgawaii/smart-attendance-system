const attendanceModel = require('../models/attendance.model');
const qrModel = require('../models/qr.model');
const userModel = require('../models/user.model');

const logAttendance = async (req, res) => {
    try {
        const { event_id, token, device_hash } = req.body;

        // STRICT VALIDATION: Source of truth is the JWT token
        const user_id = req.user.id;

        // 0. FETCH & VALIDATE PROFILE FROM DB
        // Use findById to get the latest profile data
        const user = await userModel.findById(user_id);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (!user.enrollment_no) {
            return res.status(403).json({ error: 'Profile incomplete. Enrollment number required.' });
        }

        // 1. Validate Token
        const session = await qrModel.findValidSession(token);
        if (!session) {
            return res.status(400).json({ error: 'Invalid or expired QR token' });
        }

        // 2. Validate Event Match
        if (session.event_id != event_id) {
            return res.status(400).json({ error: 'Token does not belong to this event' });
        }

        // 3. Mark Attendance
        // Note: Using session.id for db foreign key constraint
        const log = await attendanceModel.logAttendance({
            user_id,
            event_id,
            qr_session_id: session.id,
            device_hash
        });

        res.status(201).json(log);
    } catch (error) {
        console.error(error);
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ error: 'Attendance already marked.' });
        }
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

module.exports = {
    logAttendance,
};
