const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');

// New Routes
router.post('/mark', attendanceController.markAttendance);
router.post('/mark-manual', attendanceController.markManualAttendance);

// Legacy Route (aliased to markAttendance implicitly via logAttendance export or direct)
router.post('/', attendanceController.logAttendance);

router.get('/my-history', attendanceController.getMyHistory);

module.exports = router;
