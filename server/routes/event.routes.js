const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { requireRole } = require('../middlewares/auth.middleware');

const ADMIN_ROLES = ['admin', 'super_admin', 'coordinator_admin'];

router.get('/', requireRole(ADMIN_ROLES), eventController.listEvents);
router.get('/:id', requireRole(ADMIN_ROLES), eventController.getById);
router.post('/', requireRole(ADMIN_ROLES), eventController.create);
router.put('/:id', requireRole(ADMIN_ROLES), eventController.update);
router.delete('/:id', requireRole(ADMIN_ROLES), eventController.remove);
router.post('/:id/start-qr', requireRole(ADMIN_ROLES), eventController.startQr);
router.post('/:id/stop-qr', requireRole(ADMIN_ROLES), eventController.stopQr);
router.get('/:id/current-qr', requireRole(ADMIN_ROLES), eventController.getCurrentQr);
router.get('/:id/stats', requireRole(ADMIN_ROLES), eventController.getStats);
router.get('/:id/export', requireRole(ADMIN_ROLES), eventController.exportCsv);
router.get('/:id/export-pdf', requireRole(ADMIN_ROLES), eventController.exportPdf);
router.get('/:id/recent-attendance', requireRole(ADMIN_ROLES), eventController.getRecentAttendance);
router.get('/:id/attendance', requireRole(ADMIN_ROLES), eventController.getEventAttendance);
router.get('/:id/proxy-attempts', requireRole(ADMIN_ROLES), eventController.getProxyAttempts);

router.post('/:id/start-session', requireRole(ADMIN_ROLES), eventController.startSession);
router.post('/:id/pause-session', requireRole(ADMIN_ROLES), eventController.pauseSession);
router.post('/:id/stop-session', requireRole(ADMIN_ROLES), eventController.stopSession);


module.exports = router;
