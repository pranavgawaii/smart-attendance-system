const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken, requireRole, requireSelfOrRole } = require('../middlewares/auth.middleware');

const ADMIN_ROLES = ['admin', 'super_admin', 'coordinator_admin'];

// Note: create user might be admin only?
// Create User (Admin Only)
router.post('/create', authenticateToken, requireRole(ADMIN_ROLES), userController.createUser);
router.post('/create-bulk', authenticateToken, requireRole(ADMIN_ROLES), userController.createBulkUsers);

router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);

// Admin Routes (Can ideally assume middleware checks role? or check inside controller)
// For now, let's keep it simple, controller handles or middleware. 
// Ideally we need an authorizeAdmin middleware, but app.js mounts user routes under /users
// and /users is NOT exclusively admin. 
// AdminLayout.jsx links to /admin/users -> maps to <AdminUsers /> component 
// Component calls api.get('/users'). 
// So filtering must happen here.

router.get('/', authenticateToken, requireRole(ADMIN_ROLES), userController.getAllUsers);
router.get('/:id', authenticateToken, requireSelfOrRole({ param: 'id', roles: ADMIN_ROLES }), userController.getUserById);
router.put('/:id', authenticateToken, requireRole(ADMIN_ROLES), userController.adminUpdateUser);

module.exports = router;
