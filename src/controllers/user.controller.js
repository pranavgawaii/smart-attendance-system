const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');

const createUser = async (req, res) => {
    try {
        const { name, email, enrollment_no, branch, academic_year } = req.body;

        if (!name || !email || !enrollment_no) {
            return res.status(400).json({ error: 'Name, Email, and Enrollment Number are required' });
        }

        const normalizedEmail = email.toLowerCase();

        const newUser = await userModel.createUser({
            name, email: normalizedEmail, enrollment_no, branch, role: 'student', academic_year
        });

        res.json(newUser);

    } catch (error) {
        console.error('Create User Error:', error);
        // Supabase unique violation usually shows up as an error code or message
        if (error.code === '23505' || (error.message && error.message.includes('unique'))) {
            return res.status(409).json({ error: 'User with this Email or Enrollment already exists' });
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
};

const createBulkUsers = async (req, res) => {
    try {
        const { users } = req.body;
        if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ error: 'Invalid user list provided' });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (const user of users) {
            try {
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
                results.errors.push({ enrollment: user.enrollment_no, error: (err.code === '23505' || err.message?.includes('unique')) ? 'Duplicate' : err.message });
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

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && !enrollment_no) {
            return res.status(400).json({ error: 'Enrollment Number is required' });
        }

        // Check enrollment conflict
        if (enrollment_no) {
            const conflict = await userModel.findByEnrollment(enrollment_no);
            if (conflict && conflict.id !== userId) {
                return res.status(409).json({ error: 'Enrollment number already in use' });
            }
        }

        const updatedUser = await userModel.updateUser(userId, { name, enrollment_no });

        // Generate NEW Token with updated info (only if legacy test user)
        let token = null;
        if (!req.user.supabase_id) { // Simple check if it's not a native Supabase user
            token = jwt.sign(
                {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    name: updatedUser.name,
                    enrollment_no: updatedUser.enrollment_no
                },
                process.env.JWT_SECRET || 'super-secret-jwt-key',
                { expiresIn: '24h' }
            );
        }

        res.json({ message: 'Profile updated successfully', user: updatedUser, token });

    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

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
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

const adminUpdateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, enrollment_no, branch, academic_year, user_status } = req.body;

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
