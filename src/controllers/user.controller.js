const userModel = require('../models/user.model');
const db = require('../config/db');

const jwt = require('jsonwebtoken');

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, enrollment_no } = req.body;

        // Validation: Enrollment is required only for students
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        if (req.user.role !== 'admin' && !enrollment_no) {
            return res.status(400).json({ error: 'Enrollment Number is required' });
        }

        // Check enrollment conflict (if changed)
        // Simple check: is enr used by another user?
        const conflictQuery = 'SELECT id FROM users WHERE enrollment_no = $1 AND id != $2';
        const conflict = await db.query(conflictQuery, [enrollment_no, userId]);
        if (conflict.rows.length > 0) {
            return res.status(409).json({ error: 'Enrollment number already in use' });
        }

        const updateQuery = `
            UPDATE users 
            SET name = $1, enrollment_no = $2
            WHERE id = $3
            RETURNING id, name, email, enrollment_no, role
        `;
        const { rows } = await db.query(updateQuery, [name, enrollment_no, userId]);
        const updatedUser = rows[0];

        // Generate NEW Token with updated info
        const token = jwt.sign(
            {
                id: updatedUser.id,
                email: updatedUser.email,
                role: updatedUser.role,
                name: updatedUser.name,
                enrollment_no: updatedUser.enrollment_no
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ message: 'Profile updated successfully', user: updatedUser, token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Don't return sensitive info if any
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.findAll();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const adminUpdateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, enrollment_no, branch, academic_year, user_status } = req.body;

        // Validation if needed

        const updatedUser = await userModel.adminUpdate(id, { name, enrollment_no, branch, academic_year, user_status });
        if (!updatedUser) return res.status(404).json({ error: 'User not found' });

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    updateProfile,
    getProfile,
    getAllUsers,
    adminUpdateUser
};
