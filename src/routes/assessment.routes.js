const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessment.controller');
const { requireRole } = require('../middlewares/auth.middleware');

const ADMIN_ROLES = ['admin', 'super_admin', 'coordinator_admin'];

router.get('/', requireRole(ADMIN_ROLES), assessmentController.getAssessments);
router.post('/', requireRole(ADMIN_ROLES), assessmentController.createAssessment);
router.get('/:id', requireRole(ADMIN_ROLES), assessmentController.getAssessmentDetails);
router.post('/:id/candidates', requireRole(ADMIN_ROLES), assessmentController.addCandidates);
router.delete('/:id/candidates/:userId', requireRole(ADMIN_ROLES), assessmentController.removeCandidate);

router.post('/:id/allocations/generate', requireRole(ADMIN_ROLES), assessmentController.generateAllocations);
router.post('/:id/allocations/confirm', requireRole(ADMIN_ROLES), assessmentController.confirmAllocations);
router.get('/:id/allocations', requireRole(ADMIN_ROLES), assessmentController.getAllocations);
router.put('/:id/allocations/:allocationId', requireRole(ADMIN_ROLES), assessmentController.updateAllocation);
router.get('/:id/allocations/export/csv', requireRole(ADMIN_ROLES), assessmentController.exportAllocationsCsv);
router.get('/:id/allocations/export/pdf', requireRole(ADMIN_ROLES), assessmentController.exportAllocationsPdf);

module.exports = router;
