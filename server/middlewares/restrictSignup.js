const { supabase } = require('../config/db');

/**
 * Middleware to restrict signups to only pre-registered users
 * Checks if email exists in user_profiles table before allowing OTP request
 */
const restrictSignup = async (req, res, next) => {
    const email = req.body.email?.toLowerCase();

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    // Allow test users to bypass this check
    const isTestUser = email.endsWith('@test.com') || email.endsWith('@test');
    if (isTestUser) {
        return next();
    }

    try {
        console.log(`[Signup Middleware] Checking if ${email} is authorized...`);

        // Check if user exists in user_profiles
        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('email, role')
            .eq('email', email)
            .single();

        if (error || !profile) {
            console.log(`[Signup Middleware] Unauthorized signup attempt: ${email}`);
            return res.status(403).json({
                error: 'This email is not registered in the system. Please contact admin to register.'
            });
        }

        console.log(`[Signup Middleware] Authorized user: ${email} (${profile.role})`);
        next();

    } catch (err) {
        console.error('[Signup Middleware] Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { restrictSignup };
