const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessment.controller');
const { authenticateToken } = require('../middlewares/auth.middleware'); // Admin check assumed

router.get('/', authenticateToken, assessmentController.getAssessments);
router.post('/', authenticateToken, assessmentController.createAssessment);
router.get('/:id', authenticateToken, assessmentController.getAssessmentDetails);
router.post('/:id/candidates', authenticateToken, assessmentController.addCandidates);
router.delete('/:id/candidates/:userId', authenticateToken, assessmentController.removeCandidate);

router.post('/:id/allocations/generate', authenticateToken, assessmentController.generateAllocations);
router.post('/:id/allocations/confirm', authenticateToken, assessmentController.confirmAllocations);
router.get('/:id/allocations', authenticateToken, assessmentController.getAllocations);
router.put('/:id/allocations/:allocationId', authenticateToken, assessmentController.updateAllocation);

module.exports = router;
