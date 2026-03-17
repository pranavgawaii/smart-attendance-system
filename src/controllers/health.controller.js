const { supabase } = require('../config/db');
const { getMissingRuntimeEnv } = require('../config/runtime');

const checkHealth = (req, res) => {
    const missingRuntimeEnv = getMissingRuntimeEnv();
    const isConfigured = missingRuntimeEnv.length === 0;

    res.status(isConfigured ? 200 : 503).json({
        success: isConfigured,
        status: isConfigured ? 'OK' : 'DEGRADED',
        message: isConfigured ? 'Server is healthy' : 'Server configuration is incomplete',
        code: isConfigured ? undefined : 'SERVER_MISCONFIGURED',
        timestamp: new Date().toISOString()
    });
};

const checkDeep = async (req, res) => {
    try {
        const missingRuntimeEnv = getMissingRuntimeEnv();

        if (missingRuntimeEnv.length > 0 || !supabase) {
            return res.status(503).json({
                success: false,
                status: 'DEGRADED',
                code: 'SERVER_MISCONFIGURED',
                error: 'Server configuration is incomplete',
                timestamp: new Date().toISOString(),
                services: {
                    database: {
                        healthy: false,
                        error: 'Database client is unavailable'
                    }
                }
            });
        }

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
