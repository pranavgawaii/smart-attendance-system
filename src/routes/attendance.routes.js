const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');

router.post('/', attendanceController.logAttendance);
router.get('/my-history', attendanceController.getMyHistory);
router.get('/all', attendanceController.getAllAttendance); // Should stay protected by parent route
router.put('/:id/status', attendanceController.updateStatus);

module.exports = router;
