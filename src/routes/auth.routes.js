const express = require('express');
const { login, logout, getCurrentUser } = require('../controllers/auth.controller');

const router = express.Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/logout
router.post('/logout', logout);

// GET /api/auth/me
router.get('/me', getCurrentUser);

module.exports = router;
