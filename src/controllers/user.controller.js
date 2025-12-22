const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const create = async (req, res) => {
    try {
        const user = await userModel.createUser(req.body);
        res.status(201).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

const updateProfile = async (req, res) => {
    const { name, enrollment_no, branch } = req.body;
    const userId = req.user.id;

    if (!name || !enrollment_no || !branch) {
        return res.status(400).json({ error: 'All fields (name, enrollment_no, branch) are required' });
    }

    try {
        const updatedUser = await userModel.updateUser(userId, { name, enrollment_no, branch });

        // Generate new token with updated info
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

        res.json({ message: 'Profile updated', user: updatedUser, token });
    } catch (error) {
        console.error("Profile Update Error:", error);

        // Handle Unique Constraint Violation (e.g., Enrollment No already exists)
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Enrollment number already in use by another student.' });
        }

        // Handle Not Null Violation
        if (error.code === '23502') {
            return res.status(400).json({ error: 'Missing required fields in database.' });
        }

        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    create,
    updateProfile,
};
