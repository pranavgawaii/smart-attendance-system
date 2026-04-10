const { supabase } = require('../config/db');

// Login with Email + Password
const login = async (req, res) => {
    try {
        const { email: rawEmail, password } = req.body;
        const email = rawEmail?.trim().toLowerCase();

        // Validate inputs
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                code: 'AUTH_VALIDATION_FAILED',
                error: 'Email and password are required'
            });
        }

        if (!supabase) {
            console.error('[Auth] Supabase client not initialized. Check Env Vars.');
            return res.status(500).json({
                success: false,
                code: 'AUTH_SERVICE_UNAVAILABLE',
                error: 'Authentication service not configured. Please contact administrator.'
            });
        }

        // Supabase auth sign in
        console.log(`[Auth] Attempting login for: ${email}`);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error(`[Auth] ❌ Supabase Auth Rejection: ${error.message}`);
            return res.status(error.status || 401).json({
                code: 'AUTH_FAILED',
                success: false,
                error: 'Invalid credentials. Check email/password or Supabase project.',
                message: error.message
            });
        }

        // Get user profile with role
        console.log(`[Auth] ✅ Auth successful. Fetching profile for: ${email}`);
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .ilike('email', email)
            .single();

        if (profileError || !profile) {
            console.error('[Auth] ❌ Profile lookup failed for authenticated user:', email);
            return res.status(404).json({
                success: false,
                error: 'Login successful, but user has no profile record in user_profiles table.',
                code: 'PROFILE_MISSING'
            });
        }

        if (profile.user_status && profile.user_status !== 'active') {
            await supabase.auth.signOut().catch(() => {});
            return res.status(403).json({
                success: false,
                code: 'AUTH_USER_DISABLED',
                error: 'Your account is disabled. Contact administrator.'
            });
        }

        console.log(`[Auth] ✅ Profile found. Role: ${profile.role}`);

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
            token: data.session.access_token,
            session: data.session
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            code: 'AUTH_LOGIN_FAILED',
            error: 'Login failed'
        });
    }
};

// Logout
const logout = async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            return res.status(500).json({
                success: false,
                code: 'AUTH_LOGOUT_FAILED',
                error: 'Logout failed'
            });
        }

        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({
            success: false,
            code: 'AUTH_LOGOUT_FAILED',
            error: 'Logout failed'
        });
    }
};

// Get current user
const getCurrentUser = async (req, res) => {
    try {
        const profile = req.user;

        return res.json({
            success: true,
            user: {
                id: profile.id,
                email: profile.email,
                role: profile.role,
                name: profile.name,
                enrollment_no: profile.enrollment_no,
                user_status: profile.user_status || 'active'
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            code: 'AUTH_CURRENT_USER_FAILED',
            error: 'Failed to get user'
        });
    }
};

module.exports = {
    login,
    logout,
    getCurrentUser
};
