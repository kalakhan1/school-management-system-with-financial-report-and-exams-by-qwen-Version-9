require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
connectDB();

// Security & Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { success: false, error: 'Too many requests' } });
app.use('/api/', limiter);

// Static Files
app.use(express.static(path.join(__dirname, '../public')));

// Health Check
app.get('/api/health', (req, res) => res.status(200).json({ success: true, message: 'Server running' }));

// Core Modules
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/students', require('./routes/student.routes'));
app.use('/api/teachers', require('./routes/teacher.routes'));
app.use('/api/classes', require('./routes/class.routes'));

// Finance
app.use('/api/fees', require('./routes/fee.routes'));
app.use('/api/expenses', require('./routes/expense.routes'));
app.use('/api/salaries', require('./routes/salary.routes'));

// Examination
app.use('/api/exams', require('./routes/exam.routes'));
app.use('/api/results', require('./routes/result.routes'));
app.use('/api/test-results', require('./routes/testResult.routes'));

// Reports
app.use('/api/class-results', require('./routes/classResultReport.routes'));

// Attendance (NEW)
app.use('/api/attendance', require('./routes/attendance.routes'));

// Backup & Restore
app.use('/api/backup', require('./routes/backup.routes'));

// Utilities
app.use('/api/archive', require('./routes/archive.routes'));
app.use('/api/settings', require('./routes/setting.routes'));
app.use('/api/audit', require('./routes/audit.routes'));
app.use('/api/data-manager', require('./routes/dataManager.routes'));
app.use('/api/financial-reports', require('./routes/financialReport.routes'));
app.use('/api/fee-reminders', require('./routes/feeReminder.routes'));
app.use('/api/id-cards', require('./routes/idCard.routes'));
app.use('/api/database-tools', require('./routes/databaseTool.routes'));

// SPA Fallback
app.get('*', (req, res) => {
  if (!req.originalUrl.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));