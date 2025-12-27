const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');

router.get('/', eventController.listEvents);
router.post('/', eventController.create);
router.put('/:id', eventController.update);
router.delete('/:id', eventController.remove);
router.post('/:id/start-qr', eventController.startQr);
router.post('/:id/stop-qr', eventController.stopQr);
router.get('/:id/current-qr', eventController.getCurrentQr);
router.get('/:id/stats', eventController.getStats);
router.get('/:id/export', eventController.exportCsv);
router.get('/:id/export-pdf', eventController.exportPdf);
router.get('/:id/recent-attendance', eventController.getRecentAttendance);
router.get('/:id/attendance', eventController.getEventAttendance);
router.get('/:id/audit-alerts', eventController.getAuditAlerts);

router.post('/:id/open-entry', eventController.openEntry);
router.post('/:id/open-exit', eventController.openExit);
router.post('/:id/close-attendance', eventController.closeAttendance);

router.post('/:id/start-session', eventController.startSession);
router.post('/:id/pause-session', eventController.pauseSession);
router.post('/:id/stop-session', eventController.stopSession);


module.exports = router;
