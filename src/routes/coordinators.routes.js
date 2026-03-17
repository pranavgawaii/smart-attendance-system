const express = require('express');
const router = express.Router();
const coordinatorsController = require('../controllers/coordinators.controller');
const { authenticateToken, authorizeRole } = require('../middlewares/auth.middleware');

// All routes require authentication and admin/coordinator_admin role
// router.use(authenticateToken);
// router.use(authorizeRole(['admin', 'super_admin', 'coordinator_admin']));

// GET /api/coordinators - Get all coordinators
router.get('/', coordinatorsController.getAllCoordinators);

// POST /api/coordinators - Add new coordinator
router.post('/', coordinatorsController.addCoordinator);

// PUT /api/coordinators/:id - Update coordinator
router.put('/:id', coordinatorsController.updateCoordinator);

// DELETE /api/coordinators/:id - Delete coordinator
router.delete('/:id', coordinatorsController.deleteCoordinator);

// POST /api/coordinators/attendance-pdf - Generate attendance PDF
router.post('/attendance-pdf', coordinatorsController.generateAttendancePDF);

module.exports = router;
