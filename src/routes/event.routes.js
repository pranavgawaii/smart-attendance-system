const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');

router.get('/', eventController.listEvents);
router.post('/', eventController.create);
router.post('/:id/start-qr', eventController.startQr);
router.post('/:id/stop-qr', eventController.stopQr);
router.get('/:id/current-qr', eventController.getCurrentQr);
router.get('/:id/stats', eventController.getStats);
router.get('/:id/export', eventController.exportCsv);
router.get('/:id/recent-attendance', eventController.getRecentAttendance);

module.exports = router;
