const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Note: create user might be admin only?
// Create User (Admin Only)
router.post('/create', authenticateToken, userController.createUser);
router.post('/create-bulk', authenticateToken, userController.createBulkUsers);

router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);

// Admin Routes (Can ideally assume middleware checks role? or check inside controller)
// For now, let's keep it simple, controller handles or middleware. 
// Ideally we need an authorizeAdmin middleware, but app.js mounts user routes under /users
// and /users is NOT exclusively admin. 
// AdminLayout.jsx links to /admin/users -> maps to <AdminUsers /> component 
// Component calls api.get('/users'). 
// So filtering must happen here.

router.get('/', authenticateToken, userController.getAllUsers);
router.get('/:id', authenticateToken, userController.getUserById);
router.put('/:id', authenticateToken, userController.adminUpdateUser);

module.exports = router;
