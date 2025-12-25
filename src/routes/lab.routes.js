const express = require('express');
const router = express.Router();
const labController = require('../controllers/lab.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// All Lab routes should be admin only ideally. 
// For now, authenticateToken checks if user is logged in. 
// Real role check is implicit in Admin Dashboard access, but backend should enforce too.

router.get('/', authenticateToken, labController.getAllLabs);
router.post('/', authenticateToken, labController.createLab);
router.put('/:id', authenticateToken, labController.updateLab);

module.exports = router;
