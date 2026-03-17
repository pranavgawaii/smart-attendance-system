const { supabase } = require('../config/db');

const checkHealth = (req, res) => {
    res.status(200).json({
        success: true,
        status: 'OK',
        message: 'Server is healthy',
        timestamp: new Date().toISOString()
    });
};

const checkDeep = async (req, res) => {
    try {
        const [usersResult, activeEventsResult] = await Promise.all([
            supabase
                .from('user_profiles')
                .select('id', { count: 'exact', head: true }),
            supabase
                .from('events')
                .select('id', { count: 'exact', head: true })
                .eq('session_state', 'ACTIVE')
        ]);

        const dbHealthy = !usersResult.error && !activeEventsResult.error;
        const status = dbHealthy ? 'OK' : 'DEGRADED';

        return res.status(dbHealthy ? 200 : 503).json({
            success: dbHealthy,
            status,
            timestamp: new Date().toISOString(),
            services: {
                database: {
                    healthy: dbHealthy,
                    user_profiles_count: usersResult.count || 0,
                    active_sessions_count: activeEventsResult.count || 0,
                    error: usersResult.error?.message || activeEventsResult.error?.message || null
                }
            },
            runtime: {
                node_version: process.version,
                environment: process.env.NODE_ENV || 'development',
                platform: process.platform
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            code: 'HEALTH_CHECK_FAILED',
            error: 'Deep health check failed'
        });
    }
};

module.exports = {
    checkHealth,
    checkDeep
};
