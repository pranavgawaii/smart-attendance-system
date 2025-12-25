const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health.routes');
const userRoutes = require('./routes/user.routes');
const eventRoutes = require('./routes/event.routes');
const qrRoutes = require('./routes/qr.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const authRoutes = require('./routes/auth.routes');
const labRoutes = require('./routes/lab.routes');
const assessmentRoutes = require('./routes/assessment.routes');
const studentRoutes = require('./routes/student.routes');
const { authenticateToken } = require('./middlewares/auth.middleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/events', authenticateToken, eventRoutes);
app.use('/qr-sessions', authenticateToken, qrRoutes);
app.use('/attendance', authenticateToken, attendanceRoutes);
app.use('/labs', authenticateToken, labRoutes);
app.use('/assessments', authenticateToken, assessmentRoutes);
app.use('/student', authenticateToken, studentRoutes);

// Serve Frontend in Production
const path = require('path');
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

module.exports = app;
