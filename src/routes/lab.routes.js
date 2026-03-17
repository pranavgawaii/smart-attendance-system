const express = require('express');
const router = express.Router();
const labController = require('../controllers/lab.controller');
const { requireRole } = require('../middlewares/auth.middleware');

const ADMIN_ROLES = ['admin', 'super_admin', 'coordinator_admin'];

// All Lab routes should be admin only ideally. 
// For now, authenticateToken checks if user is logged in. 
// Real role check is implicit in Admin Dashboard access, but backend should enforce too.

router.get('/', requireRole(ADMIN_ROLES), labController.getAllLabs);
router.post('/', requireRole(ADMIN_ROLES), labController.createLab);
router.put('/:id', requireRole(ADMIN_ROLES), labController.updateLab);

module.exports = router;
