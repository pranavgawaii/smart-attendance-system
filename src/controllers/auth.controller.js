const { supabase } = require('../config/db');
const jwt = require('jsonwebtoken');

/**
 * requestOtp (POST /api/auth/request-otp)
 * Sends an OTP to the user's email via Supabase Auth
 */
const requestOtp = async (req, res) => {
    const email = req.body.email?.toLowerCase();

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const isTestUser = email.endsWith('@test.com') || email.endsWith('@test');

    try {
        console.log(`[Auth] OTP Request for: ${email}`);

        // 1. Bypass for Test Accounts
        if (isTestUser) {
            console.log(`[Auth] Test account detected. Skipping Supabase request-otp.`);
            return res.status(200).json({
                message: 'Test mode: Use OTP 123456',
                is_test: true
            });
        }

        // 2. Real Account: Use Supabase Magic Link / OTP
        const { error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
                shouldCreateUser: false // Don't auto-create users on login
            }
        });

        if (error) {
            console.error('[Auth] Supabase signInWithOtp error:', error.message);
            return res.status(error.status || 500).json({ error: error.message });
        }

        res.status(200).json({ message: 'OTP sent to your email.' });

    } catch (err) {
        console.error('[Auth] Unexpected error in requestOtp:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * verifyOtp (POST /api/auth/verify-otp)
 * Verifies the OTP and returns a session/token
 */
const verifyOtp = async (req, res) => {
    const email = req.body.email?.toLowerCase();
    const { otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const isTestUser = email.endsWith('@test.com') || email.endsWith('@test');

    try {
        let userData = null;
        let sessionToken = null;

        // 1. Bypass for Test Accounts
        if (isTestUser && otp === '123456') {
            console.log(`[Auth] Verifying test account: ${email}`);

            // Lookup user directly in user_profiles
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('email', email)
                .single();

            if (profileError || !profile) {
                console.error('[Auth] Test user profile not found:', profileError?.message);
                return res.status(403).json({ error: 'Test account not found in system.' });
            }

            userData = profile;
            // Generate a manual JWT since we don't have a Supabase session
            sessionToken = jwt.sign(
                { id: profile.id, email: profile.email, role: profile.role },
                process.env.JWT_SECRET || 'super-secret-jwt-key',
                { expiresIn: '24h' }
            );
        } else {
            // 2. Real Account: Verify with Supabase
            const { data, error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'email'
            });

            if (error) {
                console.error('[Auth] Supabase verifyOtp error:', error.message);
                return res.status(error.status || 400).json({ error: error.message });
            }

            const supabaseUser = data.user;
            sessionToken = data.session?.access_token;

            // 3. Fetch role and bio from user_profiles
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', supabaseUser.id)
                .single();

            if (profileError || !profile) {
                console.error('[Auth] User profile lookup failed:', profileError?.message);
                return res.status(403).json({ error: 'User valid, but no profile found. Contact admin.' });
            }

            userData = profile;
        }

        console.log(`[Auth] Login successful for: ${email} (${userData.role})`);
        res.status(200).json({
            message: 'Login successful',
            token: sessionToken,
            user: userData
        });

    } catch (err) {
        console.error('[Auth] Unexpected error in verifyOtp:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * logout (POST /api/auth/logout)
 */
const logout = async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('[Auth] Logout error:', err.message);
        res.status(500).json({ error: 'Failed to logout' });
    }
};

module.exports = {
    requestOtp,
    verifyOtp,
    logout
};
