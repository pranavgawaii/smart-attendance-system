const eventModel = require('../models/event.model');
const qrService = require('../services/qr.service');
const qrModel = require('../models/qr.model');
const attendanceModel = require('../models/attendance.model');

// --- CRUD ---

const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await eventModel.findById(id);
        if (!event) return res.status(404).json({ error: 'Event not found' });
        res.json(event);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const create = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

        const event = await eventModel.createEvent({
            ...req.body,
            created_by: req.user.id,
            start_time: req.body.start_time || new Date().toISOString(),
            end_time: req.body.end_time || new Date(Date.now() + 3600000).toISOString()
        });
        res.status(201).json(event);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await eventModel.updateEvent(id, req.body);
        if (!updated) return res.status(404).json({ error: 'Event not found' });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const remove = async (req, res) => {
    try {
        const { id } = req.params;
        await eventModel.deleteEvent(id);
        res.json({ message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const listEvents = async (req, res) => {
    try {
        const events = await eventModel.findAll();
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- SESSION CONTROL ---

const startSession = async (req, res) => {
    try {
        const { id } = req.params;
        await eventModel.updateSessionState(id, 'ACTIVE');
        const event = await eventModel.findById(id);
        const interval = event.qr_refresh_interval || 10;
        await qrService.startRotation(id, interval);
        res.json({ message: 'Session started' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const pauseSession = async (req, res) => {
    try {
        const { id } = req.params;
        await eventModel.updateSessionState(id, 'PAUSED');
        qrService.stopRotation(id);
        res.json({ message: 'Session paused' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const stopSession = async (req, res) => {
    try {
        const { id } = req.params;
        await eventModel.updateSessionState(id, 'ENDED');
        qrService.stopRotation(id);
        res.json({ message: 'Session stopped' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// --- QR ---

const getCurrentQr = async (req, res) => {
    try {
        const { id } = req.params;
        const token = await qrModel.getLatestToken(id);
        if (!token) return res.status(404).json({ error: 'No active QR' });
        res.json(token);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const userModel = require('../models/user.model');

const getStats = async (req, res) => {
    try {
        const { id } = req.params;
        const count = await attendanceModel.countByEvent(id);
        const event = await eventModel.findById(id);
        const total_students = await userModel.countStudents();

        res.json({
            count,
            total_students,
            session_state: event.session_state,
            name: event.name,
            venue: event.venue
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const getRecentAttendance = async (req, res) => {
    try {
        const logs = await attendanceModel.getRecentByEvent(req.params.id);
        res.json(logs);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const getProxyAttempts = async (req, res) => {
    try {
        const logs = await attendanceModel.getProxyAttemptsByEvent(req.params.id);
        res.json(logs);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const getEventAttendance = async (req, res) => {
    try {
        const logs = await attendanceModel.findAllByEvent(req.params.id);
        res.json(logs);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const getAuditAlerts = async (req, res) => {
    // Stub
    res.json([]);
};

// --- EXPORT ---

const exportCsv = async (req, res) => {
    try {
        const records = await attendanceModel.exportByEvent(req.params.id);
        // Simple CSV generation
        const header = "Name,Enrollment,Time\n";
        const rows = records.map(r => `${r.name},${r.enrollment_no},${r.scan_time}`).join("\n");
        res.header('Content-Type', 'text/csv');
        res.attachment(`attendance_${req.params.id}.csv`);
        res.send(header + rows);
    } catch (e) {
        res.status(500).send(e.message);
    }
};

const exportPdf = async (req, res) => {
    // Basic Stub for stability
    res.status(200).send("PDF Export Not Configured");
};

// --- LEGACY ---
const openEntry = (req, res) => res.json({ message: 'Deprecated' });
const openExit = (req, res) => res.json({ message: 'Deprecated' });
const closeAttendance = (req, res) => res.json({ message: 'Deprecated' });

module.exports = {
    create,
    update,
    remove,
    listEvents,
    startSession,
    pauseSession,
    stopSession,
    getCurrentQr,
    getStats,
    getRecentAttendance,
    getProxyAttempts,
    getEventAttendance,
    getAuditAlerts,
    exportCsv,
    exportPdf,
    getById,
    openEntry,
    openExit,
    closeAttendance,
    // Aliases
    startQr: startSession,
    stopQr: stopSession
};
