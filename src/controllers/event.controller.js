const eventModel = require('../models/event.model');
const db = require('../config/db');
const auditStore = require('../utils/auditStore');
const qrModel = require('../models/qr.model');
const qrService = require('../services/qr.service');
const attendanceModel = require('../models/attendance.model');

const create = async (req, res) => {
    try {
        // 1. Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can create events' });
        }

        // 2. Validate required fields
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({
                error: 'Missing required field: name'
            });
        }

        // 4. Create event with auto-generated times
        const eventData = {
            name,
            venue: req.body.venue || 'TBD',
            start_time: now.toISOString(),
            end_time: oneHourLater.toISOString(),
            qr_refresh_interval: req.body.qr_refresh_interval || 10,
            created_by: req.user.id
        };

        const event = await eventModel.createEvent(eventData);
        res.status(201).json(event);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

const startQr = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await eventModel.findById(id);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        const interval = event.qr_refresh_interval || 10; // Default 10s
        await qrService.startRotation(id, interval);

        res.status(200).json({ message: 'QR rotation started' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const stopQr = async (req, res) => {
    try {
        const { id } = req.params;
        qrService.stopRotation(id);
        res.status(200).json({ message: 'QR rotation stopped' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getCurrentQr = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await qrModel.getLatestSession(id);
        if (!session) return res.status(404).json({ error: 'No active QR found' });

        // Safety check: Don't return expired tokens
        if (new Date(session.expires_at) < new Date()) {
            return res.status(404).json({ error: 'QR expired, waiting for next rotation' });
        }

        res.status(200).json(session);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const listEvents = async (req, res) => {
    try {
        const events = await eventModel.findAll();
        res.status(200).json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getStats = async (req, res) => {
    try {
        const { id } = req.params;
        const count = await attendanceModel.countByEvent(id);
        const event = await eventModel.findById(id);
        res.status(200).json({
            count,
            phase: event.attendance_phase || 'CLOSED',
            session_state: event.session_state || 'NOT_STARTED',
            name: event.name,
            venue: event.venue
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



const getAuditAlerts = async (req, res) => {
    try {
        const event_id = req.params.id;
        const alerts = auditStore.getAlerts(event_id);
        res.json(alerts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const exportCsv = async (req, res) => {
    try {
        const { id } = req.params;
        const records = await attendanceModel.exportByEvent(id);

        const headers = ['Name,Email,Enrollment,Time,Status'];
        const csvRows = records.map(r =>
            `${r.name},${r.email},${r.enrollment_no || ''},${r.scan_time},${r.status}`
        );
        const csvContent = headers.concat(csvRows).join('\n');

        res.header('Content-Type', 'text/csv');
        res.attachment(`attendance-event-${id}.csv`);
        res.send(csvContent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getRecentAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit) || 15;
        const recentLogs = await attendanceModel.getRecentByEvent(id, limit);
        res.status(200).json(recentLogs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const startSession = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await eventModel.updateSessionState(id, 'ACTIVE');
        res.json(updated);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const pauseSession = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await eventModel.updateSessionState(id, 'NOT_STARTED'); // Pause = Back to Not Started logic-wise for now, or new state? 
        // User req: "PAUSE SESSION → session_state = NOT_STARTED"
        res.json(updated);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const stopSession = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await eventModel.updateSessionState(id, 'STOPPED');
        res.json(updated);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// Kept for backward compat if needed, but client updates will remove calls
const openEntry = async (req, res) => { res.status(410).json({ error: 'Deprecated' }); };
const openExit = async (req, res) => { res.status(410).json({ error: 'Deprecated' }); };
const closeAttendance = async (req, res) => { res.status(410).json({ error: 'Deprecated' }); };

module.exports = {
    create,
    listEvents,
    startQr,
    stopQr,
    getCurrentQr,
    getStats,
    exportCsv,
    getRecentAttendance,
    getAuditAlerts,
    openEntry,
    openExit,
    closeAttendance,
    startSession,
    pauseSession,
    stopSession
};
