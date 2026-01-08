const userModel = require('../models/user.model');
const db = require('../config/db');

const jwt = require('jsonwebtoken');


const createUser = async (req, res) => {
    try {
        const { name, email, enrollment_no, branch, academic_year } = req.body;

        // Basic Validation
        if (!name || !email || !enrollment_no) {
            return res.status(400).json({ error: 'Name, Email, and Enrollment Number are required' });
        }

        // Normalize email
        const normalizedEmail = email.toLowerCase();

        // Check for existing user by email or enrollment
        // We can let the DB unique constraint handle it, but a check is nicer.
        // For now, try insert and catch error.

        const newUser = await userModel.createUser({
            name, email: normalizedEmail, enrollment_no, branch, role: 'student', academic_year
        });

        res.json(newUser);

    } catch (error) {
        console.error('Create User Error:', error);
        if (error.code === '23505') { // Postgres Unique Violation
            return res.status(409).json({ error: 'User with this Email or Enrollment already exists' });
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
};

const createBulkUsers = async (req, res) => {
    try {
        const { users } = req.body; // Expect array of user objects
        if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ error: 'Invalid user list provided' });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        // TODO: Use a bulk insert query for performance, but loop is safer for individual errors for now.
        for (const user of users) {
            try {
                // Ensure required fields
                if (!user.name || !user.email || !user.enrollment_no) {
                    results.failed++;
                    results.errors.push({ enrollment: user.enrollment_no, error: 'Missing Required Fields' });
                    continue;
                }

                await userModel.createUser({
                    name: user.name,
                    email: user.email.toLowerCase(),
                    enrollment_no: user.enrollment_no,
                    branch: user.branch || '',
                    role: 'student',
                    academic_year: user.academic_year || null
                });
                results.success++;
            } catch (err) {
                console.error('Bulk Insert Error for', user.email, err.message);
                results.failed++;
                results.errors.push({ enrollment: user.enrollment_no, error: err.code === '23505' ? 'Duplicate' : err.message });
            }
        }

        res.json({ message: 'Bulk processing complete', ...results });

    } catch (error) {
        console.error('Bulk Create Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

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


const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userModel.findById(id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    updateProfile,
    getProfile,
    getAllUsers,
    adminUpdateUser,
    createUser,
    createBulkUsers,
    getUserById
};
