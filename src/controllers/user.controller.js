const { supabase } = require('../config/db');
const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');

const isAdminUser = (user) => ['admin', 'super_admin'].includes(user?.role);

const createUser = async (req, res) => {
    try {
        if (!isAdminUser(req.user)) {
            return res.status(403).json({
                success: false,
                code: 'AUTH_FORBIDDEN',
                error: 'Only admin users can create accounts'
            });
        }

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
        if (!isAdminUser(req.user)) {
            return res.status(403).json({
                success: false,
                code: 'AUTH_FORBIDDEN',
                error: 'Only admin users can bulk-create accounts'
            });
        }

        const { users } = req.body;
        if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ error: 'Invalid user list provided' });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [],
            credentials: [] // To return generated passwords
        };

        const DEPT_PREFIXES = {
            'computer science': 'cse',
            'information technology': 'it',
            'electronics': 'ece',
            'electronics & telecommunication': 'entc',
            'mechanical': 'mech',
            'civil': 'civil',
            'robotics': 'robo',
            'artificial intelligence': 'ai'
        };

        // Helper to get prefix
        const getDeptPrefix = (dept) => {
            if (!dept) return 'student';
            const lowerDept = dept.toLowerCase().trim();
            for (const key in DEPT_PREFIXES) {
                if (lowerDept.includes(key)) return DEPT_PREFIXES[key];
            }
            return 'mit'; // Default fallback
        };

        for (const user of users) {
            try {
                // 1. Validate Fields
                if (!user.name || !user.email || !user.enrollment_no || !user.mobile) {
                    results.failed++;
                    results.errors.push({ enrollment: user.enrollment_no, error: 'Missing Required Fields (Name, Email, Enrollment, Mobile)' });
                    continue;
                }

                const enrollment = user.enrollment_no.trim();
                const mobile = user.mobile.toString().replace(/\D/g, ''); // Digits only
                const email = user.email.toLowerCase().trim();
                const dept = user.department || '';

                if (mobile.length < 4) {
                    results.failed++;
                    results.errors.push({ enrollment: enrollment, error: 'Mobile number too short for password generation' });
                    continue;
                }

                // 2. Generate Password
                // Formula: {dept_prefix} + {last_4_enrollment} + & + {last_4_mobile}
                const deptPrefix = getDeptPrefix(dept);
                const last4Enrollment = enrollment.slice(-4);
                const last4Mobile = mobile.slice(-4);
                const password = `${deptPrefix}${last4Enrollment}&${last4Mobile}`;

                // 3. Create Supabase Auth User (Admin API)
                // This creates the user in auth.users and returns the ID
                const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                    email: email,
                    password: password,
                    email_confirm: true, // Auto-confirm email
                    user_metadata: { name: user.name, role: 'student' }
                });

                if (authError) {
                    throw authError;
                }

                const userId = authData.user.id;

                // 4. Create User Profile (If not auto-created by triggers, or to update details)
                // We'll upsert to be safe, ensuring profile exists with correct data
                const { error: profileError } = await supabase
                    .from('user_profiles')
                    .upsert({
                        id: userId, // Link to Auth ID
                        email: email,
                        name: user.name,
                        enrollment_no: enrollment,
                        branch: dept,
                        role: 'student',
                        academic_year: user.year || null,
                        user_status: 'active'
                    });

                if (profileError) {
                    // Start Rollback (Optional: Delete Auth User if profile fails for consistency)
                    // await supabase.auth.admin.deleteUser(userId); 
                    throw profileError;
                }

                // 5. Success - Add to results
                results.success++;
                results.credentials.push({
                    name: user.name,
                    email: email,
                    enrollment_no: enrollment,
                    password: password // RETURN PLAINTEXT PASSWORD FOR CSV EXPORT
                });

            } catch (err) {
                console.error('Bulk Insert Error for', user.email, err.message);
                results.failed++;
                // Handle "User already registered" specifically
                const isDuplicate = err.message?.includes('already been registered') || err.code === '23505';
                results.errors.push({
                    enrollment: user.enrollment_no,
                    error: isDuplicate ? 'User/Email already exists' : err.message
                });
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
        const legacyJwtSecret = process.env.JWT_SECRET?.trim();
        if (!req.user.supabase_id && legacyJwtSecret) { // Simple check if it's not a native Supabase user
            token = jwt.sign(
                {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    name: updatedUser.name,
                    enrollment_no: updatedUser.enrollment_no
                },
                legacyJwtSecret,
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
        if (!isAdminUser(req.user)) {
            return res.status(403).json({
                success: false,
                code: 'AUTH_FORBIDDEN',
                error: 'Only admin users can view all users'
            });
        }

        const { page, limit, role, q } = req.query;
        const result = await userModel.findAll({ page, limit, role, q });

        if (result && Array.isArray(result.rows)) {
            const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 200);
            const safePage = Math.max(Number(page) || 1, 1);
            const total = Number(result.count) || 0;

            return res.json({
                success: true,
                items: result.rows,
                pagination: {
                    page: safePage,
                    limit: safeLimit,
                    total,
                    total_pages: Math.max(Math.ceil(total / safeLimit), 1)
                }
            });
        }

        return res.json(result);
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
