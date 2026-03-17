const eventModel = require('../models/event.model');
const qrService = require('../services/qr.service');
const attendanceModel = require('../models/attendance.model');
const PDFDocument = require('pdfkit');

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
        if (!['admin', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                code: 'AUTH_FORBIDDEN',
                error: 'Unauthorized'
            });
        }

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
        const interval = qrService.resolveIntervalSeconds(event.qr_refresh_interval || 10);
        const currentQr = qrService.getTokenForTime(id, interval, Date.now());
        res.json({
            message: 'Session started',
            current_qr: {
                token: currentQr.token,
                code: currentQr.code,
                expires_at: currentQr.expires_at
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const pauseSession = async (req, res) => {
    try {
        const { id } = req.params;
        await eventModel.updateSessionState(id, 'PAUSED');
        res.json({ message: 'Session paused' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const stopSession = async (req, res) => {
    try {
        const { id } = req.params;
        await eventModel.updateSessionState(id, 'ENDED');
        res.json({ message: 'Session stopped' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// --- QR ---

const getCurrentQr = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await eventModel.findById(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                code: 'EVENT_NOT_FOUND',
                error: 'Event not found'
            });
        }

        if (!['ACTIVE', 'LIVE'].includes(event.session_state)) {
            return res.status(404).json({
                success: false,
                code: 'SESSION_NOT_ACTIVE',
                error: 'No active QR'
            });
        }

        const interval = qrService.resolveIntervalSeconds(event.qr_refresh_interval || 10);
        const token = qrService.getTokenForTime(id, interval, Date.now());

        return res.json({
            id: `deterministic:${id}:${token.slot}`,
            session_id: id,
            token: token.token,
            code: token.code,
            generated_at: token.generated_at,
            expires_at: token.expires_at,
            is_active: true,
            deterministic: true
        });
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

// --- EXPORT ---

const exportCsv = async (req, res) => {
    try {
        const records = await attendanceModel.exportByEvent(req.params.id);
        // Simple CSV generation
        const header = "Name,Enrollment,Time,Method\n";
        const rows = records.map(r =>
            `${r.student_name || r.name || ''},${r.enrollment_no || ''},${r.scanned_at || r.scan_time || ''},${r.scan_method || ''}`
        ).join("\n");
        res.header('Content-Type', 'text/csv');
        res.attachment(`attendance_${req.params.id}.csv`);
        res.send(header + rows);
    } catch (e) {
        res.status(500).send(e.message);
    }
};

const exportPdf = async (req, res) => {
    try {
        const eventId = req.params.id;
        const [records, event] = await Promise.all([
            attendanceModel.exportByEvent(eventId),
            eventModel.findById(eventId)
        ]);

        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const fileName = `attendance_${eventId}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        doc.pipe(res);

        doc.fontSize(16).text(`Attendance Report${event?.name ? ` - ${event.name}` : ''}`);
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#666').text(`Generated at: ${new Date().toISOString()}`);
        doc.moveDown(1);

        doc.fillColor('#000').fontSize(11).text('Name', 40, doc.y, { continued: true, width: 200 });
        doc.text('Enrollment', 240, doc.y - 12, { continued: true, width: 120 });
        doc.text('Scan Time', 360, doc.y - 12, { continued: true, width: 130 });
        doc.text('Method', 500, doc.y - 12, { width: 60 });
        doc.moveDown(0.5);

        const sorted = [...records].sort((a, b) => new Date(a.scanned_at || 0) - new Date(b.scanned_at || 0));
        sorted.forEach((row) => {
            if (doc.y > 760) {
                doc.addPage();
            }

            const name = row.student_name || row.name || '-';
            const enrollment = row.enrollment_no || '-';
            const scannedAt = row.scanned_at ? new Date(row.scanned_at).toLocaleString() : '-';
            const method = (row.scan_method || '-').toUpperCase();

            doc.fontSize(9).text(name, 40, doc.y, { continued: true, width: 200 });
            doc.text(enrollment, 240, doc.y - 10, { continued: true, width: 120 });
            doc.text(scannedAt, 360, doc.y - 10, { continued: true, width: 130 });
            doc.text(method, 500, doc.y - 10, { width: 60 });
            doc.moveDown(0.4);
        });

        doc.end();
    } catch (error) {
        res.status(500).json({ error: 'Failed to export PDF' });
    }
};

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
    exportCsv,
    exportPdf,
    getById,
    // Aliases
    startQr: startSession,
    stopQr: stopSession
};
