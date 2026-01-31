const jwt = require('jsonwebtoken');
const { supabase } = require('../config/db');
require('dotenv').config();

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.status(401).json({ error: 'Access token required' });

    try {
        // 1. Try Legacy/Test JWT Verification
        try {
            const user = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-jwt-key');
            req.user = user;
            return next();
        } catch (jwtErr) {
            // Not a legacy/test token, proceed to Supabase
        }

        // 2. Try Supabase Auth Verification
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            console.error('[AuthMiddleware] Supabase verification failed:', error?.message);
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        // 3. For real users, we need to fetch their profile/role from user_profiles
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError || !profile) {
            console.error('[AuthMiddleware] Profile lookup failed:', profileError?.message);
            return res.status(403).json({ error: 'User authenticated, but profile missing.' });
        }

        req.user = profile;
        next();

    } catch (err) {
        console.error('[AuthMiddleware] Unexpected error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied: insufficient permissions' });
        }
        next();
    };
};

const verifySuperAdmin = (req, res, next) => {
    // Check for super_admin role
    if (!req.user || req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Access denied: Super Admin only' });
    }
    next();
};

module.exports = {
    authenticateToken,
    authorizeRole,
    verifySuperAdmin
};
