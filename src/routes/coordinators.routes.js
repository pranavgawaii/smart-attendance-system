const express = require('express');
const router = express.Router();
const coordinatorsController = require('../controllers/coordinators.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// GET /api/coordinators - Get all coordinators
router.get('/', coordinatorsController.getAllCoordinators);

// POST /api/coordinators - Add new coordinator
router.post('/', coordinatorsController.addCoordinator);

// DELETE /api/coordinators/:id - Delete coordinator
router.delete('/:id', coordinatorsController.deleteCoordinator);

// POST /api/coordinators/attendance-pdf - Generate attendance PDF
router.post('/attendance-pdf', coordinatorsController.generateAttendancePDF);

module.exports = router;
