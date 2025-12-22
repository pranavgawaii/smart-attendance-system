const eventModel = require('../models/event.model');
const qrModel = require('../models/qr.model');
const qrService = require('../services/qr.service');
const attendanceModel = require('../models/attendance.model');

const create = async (req, res) => {
    try {
        const event = await eventModel.createEvent(req.body);
        res.status(201).json(event);
    } catch (error) {
        console.error(error);
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
        res.status(200).json({ count });
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
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    create,
    startQr,
    stopQr,
    getCurrentQr,
    getCurrentQr,
    listEvents,
    getStats,
    exportCsv,
    getRecentAttendance,
};
