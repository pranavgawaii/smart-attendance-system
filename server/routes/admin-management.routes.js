const express = require('express');
const router = express.Router();
const userModel = require('../models/user.model');

// List all admins
router.get('/', async (req, res) => {
    try {
        const admins = await userModel.findAdmins();
        res.json(admins);
    } catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).json({ error: 'Failed to fetch admins' });
    }
});

// Create new admin
router.post('/', async (req, res) => {
    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and Email are required' });
    }

    try {
        const newAdmin = await userModel.createUser({
            name,
            email: email.toLowerCase(),
            enrollment_no: `ADMIN-${Date.now()}`, // Placeholder enrollment for admins
            branch: 'ADMIN',
            role: 'admin',
            academic_year: 'N/A'
        });
        res.status(201).json(newAdmin);
    } catch (error) {
        console.error('Error creating admin:', error);
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Failed to create admin' });
    }
});

// Toggle admin status
router.put('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'active' or 'disabled'

    if (!['active', 'disabled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Use "active" or "disabled".' });
    }

    try {
        const updatedAdmin = await userModel.toggleUserStatus(id, status);
        if (!updatedAdmin) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(updatedAdmin);
    } catch (error) {
        console.error('Error updating admin status:', error);
        res.status(500).json({ error: 'Failed to update admin status' });
    }
});

module.exports = router;
