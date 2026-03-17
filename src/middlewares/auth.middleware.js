const { supabase } = require('../config/db');
require('dotenv').config();

const sendError = (res, status, code, error, details) => {
    const payload = { success: false, code, error };
    if (details !== undefined) payload.details = details;
    return res.status(status).json(payload);
};

const sendAuthError = (res, code, error) => sendError(res, 401, code, error);
const sendForbidden = (res, code, error) => sendError(res, 403, code, error);

const normalizeRole = (value) => String(value || '').trim().toLowerCase();
const hasAllowedRole = (user, allowedRoles = []) => {
    const role = normalizeRole(user?.role);
    return allowedRoles.map(normalizeRole).includes(role);
};

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return sendAuthError(res, 'AUTH_TOKEN_MISSING', 'Access token required');
    }

    if (!supabase) {
        return sendError(
            res,
            503,
            'AUTH_SERVICE_UNAVAILABLE',
            'Authentication service is not configured'
        );
    }

    try {
        // NOTE: Legacy JWT path intentionally removed.
        // Supabase access tokens share the same JWT secret, so jwt.verify() would
        // succeed on them — but the decoded payload has role: "authenticated" (Supabase
        // internal), NOT the user's actual role from user_profiles. This caused 403s.
        // All authentication now flows through Supabase auth.getUser() below.

        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data?.user) {
            const isExpiredToken = /expired/i.test(error?.message || '');
            return sendAuthError(
                res,
                isExpiredToken ? 'AUTH_TOKEN_EXPIRED' : 'AUTH_TOKEN_INVALID',
                isExpiredToken ? 'Token expired. Please login again.' : 'Invalid token. Please login again.'
            );
        }

        let { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

        if (!profile && data.user.email) {
            const { data: emailProfile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('email', data.user.email)
                .maybeSingle();

            if (emailProfile) {
                profile = emailProfile;
                supabase
                    .from('user_profiles')
                    .update({ id: data.user.id })
                    .eq('email', data.user.email)
                    .then(() => {})
                    .catch(() => {});
            }
        }

        if (!profile) {
            return sendForbidden(res, 'AUTH_PROFILE_MISSING', 'User authenticated, but profile missing.');
        }

        if (profile.user_status && profile.user_status !== 'active') {
            return sendForbidden(res, 'AUTH_USER_DISABLED', 'Your account has been disabled. Contact administrator.');
        }

        console.log(`[Auth] ✅ Authenticated: ${profile.email || data.user.email} | Role: ${profile.role}`);
        req.user = profile;
        return next();
    } catch (err) {
        console.error('[AuthMiddleware] Unexpected error:', err);
        return sendError(res, 500, 'AUTH_INTERNAL_ERROR', 'Internal server error');
    }
};

const requireRole = (allowedRoles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return sendAuthError(res, 'AUTH_UNAUTHENTICATED', 'Authentication required');
        }

        if (!hasAllowedRole(req.user, allowedRoles)) {
            console.warn(`[Auth] 🚫 Role denied: user role="${req.user.role}" not in [${allowedRoles.join(', ')}] | path=${req.originalUrl}`);
            return sendForbidden(res, 'AUTH_FORBIDDEN', 'Access denied: insufficient permissions');
        }

        return next();
    };
};

const requireSelfOrRole = ({ param = 'id', roles = [] } = {}) => {
    return (req, res, next) => {
        if (!req.user) {
            return sendAuthError(res, 'AUTH_UNAUTHENTICATED', 'Authentication required');
        }

        const targetValue = String(req.params?.[param] || '').trim();
        const currentUserId = String(req.user.id || '').trim();

        if (targetValue && currentUserId && targetValue === currentUserId) {
            return next();
        }

        if (hasAllowedRole(req.user, roles)) {
            return next();
        }

        return sendForbidden(res, 'AUTH_FORBIDDEN', 'Access denied: insufficient permissions');
    };
};

const authorizeRole = (allowedRoles = []) => requireRole(allowedRoles);

const verifySuperAdmin = (req, res, next) => {
    if (!req.user) {
        return sendAuthError(res, 'AUTH_UNAUTHENTICATED', 'Authentication required');
    }

    if (!hasAllowedRole(req.user, ['super_admin'])) {
        return sendForbidden(res, 'AUTH_SUPER_ADMIN_REQUIRED', 'Access denied: Super Admin only');
    }

    return next();
};

module.exports = {
    authenticateToken,
    authorizeRole,
    requireRole,
    requireSelfOrRole,
    verifySuperAdmin
};
