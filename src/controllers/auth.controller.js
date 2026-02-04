const { supabase } = require('../config/db');

// Login with Email + Password
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate inputs
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        // Supabase auth sign in
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        // Get user profile with role
        console.log(`[Auth] Searching for profile with email: "${email}" in user_profiles`);
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .ilike('email', email)
            .single();

        if (profileError || !profile) {
            console.error('[Auth] Profile lookup failed:', profileError?.message || 'No profile data found');
            return res.status(404).json({
                error: 'User profile not found'
            });
        }
        console.log(`[Auth] Profile found for: ${profile.email}, role: ${profile.role}`);

        // Return user data with role
        return res.json({
            success: true,
            user: {
                id: data.user.id,
                email: data.user.email,
                role: profile.role,
                name: profile.name,
                enrollment_no: profile.enrollment_no
            },
            token: data.session.access_token, // Normalized for frontend
            session: data.session
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Login failed' });
    }
};

// Logout
const logout = async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            return res.status(500).json({ error: 'Logout failed' });
        }

        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: 'Logout failed' });
    }
};

// Get current user
const getCurrentUser = async (req, res) => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        // Get profile
        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

        return res.json({
            user: {
                id: user.id,
                email: user.email,
                role: profile?.role,
                name: profile?.name,
                enrollment_no: profile?.enrollment_no
            }
        });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to get user' });
    }
};

module.exports = {
    login,
    logout,
    getCurrentUser
};
