const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');
const { authenticateToken, verifySuperAdmin } = require('../middlewares/auth.middleware');

router.get('/', healthController.checkHealth);
router.get('/deep', authenticateToken, verifySuperAdmin, healthController.checkDeep);

module.exports = router;
