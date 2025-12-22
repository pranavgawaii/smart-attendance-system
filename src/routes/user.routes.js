const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

router.post('/', userController.create);
router.put('/profile', authenticateToken, userController.updateProfile);

module.exports = router;
