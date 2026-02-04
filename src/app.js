const express = require('express');
const cors = require('cors');
require('dotenv').config();
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
const { authenticateToken, verifySuperAdmin } = require('./middlewares/auth.middleware');

const app = express();

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Middleware
// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// Public Test Route (No Auth)
app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is accessible', timestamp: new Date() });
});

// Debug & Health Check - Absolute Last Resort Diagnostic
app.get('/api/test', async (req, res) => {
    const { supabase } = require('./config/db');
    let dbStatus = 'Unknown';
    let dbError = null;
    let profileExists = 'Checking...';
    let authUserExists = 'Checking...';
    let userCount = 0;

    if (supabase) {
        try {
            // 1. Check if ANY users exist in user_profiles
            const { count, error } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true });

            if (error) {
                dbStatus = 'Connected but Error';
                dbError = error.message;
            } else {
                dbStatus = 'Connected and Healthy';
                userCount = count || 0;
            }

            // 2. specifically check if admin@test.com is there in user_profiles
            const { data: adminProfile } = await supabase
                .from('user_profiles')
                .select('email, role')
                .ilike('email', 'admin@test.com')
                .maybeSingle();

            profileExists = adminProfile ? `YES (${adminProfile.role})` : 'NO - Record missing from user_profiles table';

            // 3. SECURELY check if user exists in Supabase AUTH (requires service role key)
            const { data: { users }, error: authListError } = await supabase.auth.admin.listUsers();
            if (!authListError) {
                const hasAuth = users.some(u => u.email.toLowerCase() === 'admin@test.com');
                authUserExists = hasAuth ? 'YES - Account found in Auth' : 'NO - Account missing from Auth tab';
            } else {
                authUserExists = `Error checking Auth: ${authListError.message}`;
            }

        } catch (e) {
            dbStatus = 'Failed to Connect';
            dbError = e.message;
        }
    }

    res.json({
        status: 'ok',
        message: 'Backend Service Alive',
        forensics: {
            nodeVersion: process.version,
            environment: process.env.NODE_ENV,
            isVercel: !!process.env.VERCEL,
            databaseHealthy: dbStatus === 'Connected and Healthy',
            totalTableRecords: userCount,
            adminTableStatus: profileExists,
            adminAuthStatus: authUserExists,
            supabaseError: dbError
        },
        keysMasked: {
            url: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.substring(0, 15)}...` : 'MISSING',
            key: process.env.SUPABASE_SERVICE_ROLE_KEY ? `...${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(process.env.SUPABASE_SERVICE_ROLE_KEY.length - 4)}` : 'MISSING'
        }
    });
});

// Routes - Consolidated under /api
const apiRouter = express.Router();
apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/events', authenticateToken, eventRoutes);
apiRouter.use('/qr-sessions', authenticateToken, qrRoutes);
apiRouter.use('/attendance', authenticateToken, attendanceRoutes);
apiRouter.use('/labs-old', authenticateToken, labRoutes);
apiRouter.use('/labs', authenticateToken, labsRoutes);
apiRouter.use('/assessments', authenticateToken, assessmentRoutes);
apiRouter.use('/student', authenticateToken, studentRoutes);
apiRouter.use('/placement', authenticateToken, placementRoutes);
apiRouter.use('/placement-assessments', authenticateToken, placementAssessmentsRoutes);
apiRouter.use('/allocations', authenticateToken, allocationsRoutes);
apiRouter.use('/admin-management', authenticateToken, verifySuperAdmin, adminManagementRoutes);

app.use('/api', apiRouter);

// Global Error Handler (Ensure JSON response)
app.use((err, req, res, next) => {
    console.error('[Global Error]', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Explicitly handle API 404s to avoid returning index.html
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API Endpoint Not Found' });
});

// Serve Frontend in Production
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    const fs = require('fs');

    // In Vercel, __dirname is the function directory. client/dist is one level up.
    const distPath = path.join(__dirname, '../client/dist');

    console.log(`[Static] Production mode detected. Using dist path: ${distPath}`);

    if (fs.existsSync(distPath)) {
        console.log('✅ Found client/dist, enabling static serving');
        app.use(express.static(distPath));

        app.get('*', (req, res) => {
            if (!req.url.startsWith('/api')) {
                const indexPath = path.join(distPath, 'index.html');
                if (fs.existsSync(indexPath)) {
                    res.sendFile(indexPath);
                } else {
                    console.error('❌ index.html not found even though dist exists');
                    res.status(404).send('Frontend index.html missing');
                }
            } else {
                res.status(404).json({ error: 'API Endpoint Not Found' });
            }
        });
    } else {
        console.warn(`⚠️ Warning: client/dist not found at ${distPath}. Build might have failed or path is wrong.`);
    }
}

module.exports = app;
