const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qr.controller');
const { requireRole } = require('../middlewares/auth.middleware');

const ADMIN_ROLES = ['admin', 'super_admin', 'coordinator_admin'];

router.post('/', requireRole(ADMIN_ROLES), qrController.createSession);

module.exports = router;
