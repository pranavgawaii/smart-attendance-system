const express = require('express');
const cors = require('cors');
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
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    next();
});

// Force restart for new routes

// Middleware
app.use(cors());
app.use(express.json());

// Debug Route
app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: 'API is reachable', time: new Date().toISOString() });
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
// Serve Frontend (Only in production/non-Vercel environments)
// On Vercel, vercel.json handles static serving more efficiently
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    const path = require('path');
    app.use(express.static(path.join(__dirname, '../client/dist')));

    app.get(/.*/, (req, res) => {
        res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
}

module.exports = app;
