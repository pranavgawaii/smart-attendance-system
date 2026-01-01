const express = require('express');
const router = express.Router();
const placementController = require('../controllers/placement.controller');
const { authorizeRole } = require('../middlewares/auth.middleware');

// Admin Routes
router.post('/admin/drives', authorizeRole(['admin']), placementController.createDrive);

// Student Routes
// Note: 'getAllDrives' computes eligibility based on the logged-in user, usually student.
// Admins can also view, but might receive 'isEligible: false' or we can tweak logic if needed. 
// For now, let's allow both to view.
router.get('/drives', placementController.getAllDrives);

router.post('/apply', authorizeRole(['student']), placementController.applyToDrive);

module.exports = router;
