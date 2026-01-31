const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/request-otp', authController.requestOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/logout', authController.logout);

module.exports = router;
