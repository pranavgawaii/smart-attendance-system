const express = require('express');
const cors = require('cors');
require('dotenv').config();
let helmet = null;
try {
    // Optional dependency in case production image installs a reduced package set.
    helmet = require('helmet');
} catch (error) {
    console.warn('[Security] helmet is not installed. Falling back to minimal security headers.');
}
const healthRoutes = require('./routes/health.routes');
const userRoutes = require('./routes/user.routes');
const eventRoutes = require('./routes/event.routes');
const qrRoutes = require('./routes/qr.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const authRoutes = require('./routes/auth.routes');
const labRoutes = require('./routes/lab.routes');
const labsRoutes = require('./routes/labs.routes');
const assessmentRoutes = require('./routes/assessment.routes');
const studentRoutes = require('./routes/student.routes');
const placementRoutes = require('./routes/placement.routes');
const placementAssessmentsRoutes = require('./routes/placement-assessments.routes');
const allocationsRoutes = require('./routes/allocations.routes');
const adminManagementRoutes = require('./routes/admin-management.routes');
const coordinatorsRoutes = require('./routes/coordinators.routes');
const formsRoutes = require('./routes/forms.routes');
const { authRateLimiter, attendanceRateLimiter } = require('./middlewares/rate-limit.middleware');
const { attachRequestContext, requestLogger } = require('./middlewares/request-context.middleware');
const { authenticateToken, requireRole, verifySuperAdmin } = require('./middlewares/auth.middleware');
const { sendApiError } = require('./utils/api-response');
const { getMissingRuntimeEnv } = require('./config/runtime');

const app = express();
app.disable('x-powered-by');

const isProduction = process.env.NODE_ENV === 'production';
const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || '1mb';

if (!helmet && isProduction) {
    throw new Error('[Security] helmet package is required in production runtime.');
}

const parseAllowedOrigins = (rawValue) => String(rawValue || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const corsAllowlist = parseAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS);

// Middleware
app.use(attachRequestContext);
app.use(requestLogger);

if (helmet) {
    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        crossOriginEmbedderPolicy: false
    }));
} else {
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('Referrer-Policy', 'no-referrer');
        next();
    });
}

app.use(cors({
    origin(origin, callback) {
        if (!origin) {
            return callback(null, true);
        }

        // Allow Vercel preview or production URLs dynamically
        if (origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }

        // If an explicit allowlist is configured, enforce it strictly
        if (corsAllowlist.length > 0) {
            if (corsAllowlist.includes(origin)) {
                return callback(null, true);
            }
            const corsError = new Error('Origin not allowed by CORS policy');
            corsError.status = 403;
            corsError.code = 'CORS_ORIGIN_DENIED';
            return callback(corsError);
        }

        // In development OR when running on Vercel with no explicit allowlist,
        // allow all origins (frontend & API share the same Vercel deployment)
        if (!isProduction || process.env.VERCEL) {
            return callback(null, true);
        }

        const corsError = new Error('Origin not allowed by CORS policy');
        corsError.status = 403;
        corsError.code = 'CORS_ORIGIN_DENIED';
        return callback(corsError);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
}));
app.use(express.json({ limit: requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: requestBodyLimit }));

const ADMIN_ROLES = ['admin', 'super_admin', 'coordinator_admin'];

// Routes - Consolidated under /api
const apiRouter = express.Router();
apiRouter.use('/health', healthRoutes);
apiRouter.use((req, res, next) => {
    const missingRuntimeEnv = getMissingRuntimeEnv();

    if (missingRuntimeEnv.length === 0) {
        return next();
    }

    return sendApiError(res, 503, 'SERVER_MISCONFIGURED', 'Service is temporarily unavailable', {
        request_id: req.requestId
    });
});
apiRouter.use('/auth', authRateLimiter, authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/events', authenticateToken, requireRole(ADMIN_ROLES), eventRoutes);
apiRouter.use('/qr-sessions', authenticateToken, requireRole(ADMIN_ROLES), qrRoutes);
apiRouter.use('/attendance', authenticateToken, attendanceRateLimiter, attendanceRoutes);
apiRouter.use('/labs-old', authenticateToken, requireRole(ADMIN_ROLES), labRoutes);
apiRouter.use('/labs', authenticateToken, requireRole(ADMIN_ROLES), labsRoutes);
apiRouter.use('/assessments', authenticateToken, requireRole(ADMIN_ROLES), assessmentRoutes);
apiRouter.use('/student', authenticateToken, studentRoutes);
apiRouter.use('/placement', authenticateToken, placementRoutes);
apiRouter.use('/placement-assessments', authenticateToken, requireRole(ADMIN_ROLES), placementAssessmentsRoutes);
apiRouter.use('/allocations', authenticateToken, allocationsRoutes);
apiRouter.use('/coordinators', coordinatorsRoutes);
apiRouter.use('/admin-management', authenticateToken, verifySuperAdmin, adminManagementRoutes);
apiRouter.use('/forms', formsRoutes);

app.use('/api', apiRouter);
// Fallback for when reverse proxy strips the prefix
app.use(apiRouter);

// Global Error Handler (Ensure JSON response)
app.use((err, req, res, next) => {
    const status = Number(err?.status) || Number(err?.statusCode) || 500;
    const code = err?.code || (status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_FAILED');
    const message = status >= 500 ? 'Internal Server Error' : (err?.message || 'Request failed');
    const details = status >= 500 && isProduction
        ? { request_id: req.requestId }
        : { request_id: req.requestId, reason: err?.message };

    if (status >= 500) {
        console.error(`[Global Error] [${req.requestId || 'n/a'}]`, err);
    }

    return sendApiError(res, status, code, message, details);
});

// Explicitly handle API 404s to avoid returning index.html
app.use('/api', (req, res) => {
    return sendApiError(res, 404, 'API_NOT_FOUND', 'API Endpoint Not Found', {
        request_id: req.requestId
    });
});

// Serve Frontend in Production
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    const fs = require('fs');

    const distCandidates = [
        path.join(process.cwd(), 'client/dist'),
        path.join(__dirname, '../client/dist'),
        path.join(__dirname, '../../client/dist'),
        path.join(__dirname, 'client/dist'),
        path.join(process.cwd(), 'dist')
    ];
    const distPath = distCandidates.find((candidate) => fs.existsSync(path.join(candidate, 'index.html')));

    console.log(`[Static] Production mode detected. Dist candidates: ${distCandidates.join(' | ')}`);

    if (distPath) {
        console.log(`✅ Found client build at ${distPath}, enabling static serving`);
        app.use(express.static(distPath, { index: false }));

        app.get('*', (req, res) => {
            if (!req.url.startsWith('/api')) {
                if (path.extname(req.path)) {
                    return res.status(404).end();
                }

                const indexPath = path.join(distPath, 'index.html');
                if (fs.existsSync(indexPath)) {
                    return res.sendFile(indexPath);
                } else {
                    console.error('❌ index.html not found even though dist exists');
                    return res.status(404).send('Frontend index.html missing');
                }
            }

            return sendApiError(res, 404, 'API_NOT_FOUND', 'API Endpoint Not Found', {
                request_id: req.requestId
            });
        });
    } else {
        console.warn('⚠️ Warning: client/dist not found in any known production path.');
    }
}

module.exports = app;
