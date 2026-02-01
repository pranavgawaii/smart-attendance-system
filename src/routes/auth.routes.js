const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { restrictSignup } = require('../middlewares/restrictSignup');

router.post('/request-otp', restrictSignup, authController.requestOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/logout', authController.logout);

module.exports = router;
