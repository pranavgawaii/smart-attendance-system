const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const otpModel = require('../models/otp.model');
const db = require('../config/db'); // Direct db access for user lookup, or better create userModel.findByEmail
require('dotenv').config();

const nodemailer = require('nodemailer');

const REQUEST_OTP_EXPIRY_MINUTES = 5;
const RATE_LIMIT_MINUTES = 1;

// Email Transporter (Use Environment Variables in real app)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // e.g. 'your-email@gmail.com'
        pass: process.env.EMAIL_PASS  // e.g. 'your-app-password'
    }
});

const requestOtp = async (req, res) => {
    const email = req.body.email?.toLowerCase(); // Change 1: Normalize Email
    console.log("Received OTP Request for:", email); // Debug Log
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        // 1. Rate Limiting Check
        const lastOtp = await otpModel.getLatestOtp(email);
        if (lastOtp) {
            const timeDiff = (Date.now() - new Date(lastOtp.created_at).getTime()) / 60000;
            if (timeDiff < RATE_LIMIT_MINUTES) {
                return res.status(429).json({ error: `Please wait ${RATE_LIMIT_MINUTES} minute(s) before requesting again.` });
            }
        }

        // 2. Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + REQUEST_OTP_EXPIRY_MINUTES * 60000);

        await otpModel.saveOtp(email, otpHash, expiresAt);

        // 3. Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER || '"Smart Attendance" <no-reply@example.com>',
            to: email,
            subject: 'Your Attendance Login OTP',
            text: `Your OTP is: ${otp}. It expires in ${REQUEST_OTP_EXPIRY_MINUTES} minutes.`,
            html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Smart Attendance Login</h2>
                    <p>Your OTP is:</p>
                    <h1 style="color: #4CAF50; letter-spacing: 5px;">${otp}</h1>
                    <p>This code expires in <b>${REQUEST_OTP_EXPIRY_MINUTES} minutes</b>.</p>
                   </div>`
        };

        console.log(`[DEBUG] Generated OTP for ${email}: ${otp}`); // ALWAYS LOG FOR DEBUGGING

        // NON-BLOCKING: Send response immediately so UI doesn't hang
        res.status(200).json({ message: 'OTP generated. Check email or debug log.', dev_otp: otp });

        // Attempt to send email in background (Fire & Forget)
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            transporter.sendMail(mailOptions).catch(err => {
                console.error("[Background] Failed to send email:", err.message);
            });
        } else {
            console.log(`[DEV MODE] OTP generated for ${email}`);
        }

    } catch (error) {
        console.error("OTP Error:", error);
        res.status(500).json({ error: 'Failed to generate OTP.' });
    }
};

const verifyOtp = async (req, res) => {
    const email = req.body.email?.toLowerCase(); // Change 1: Normalize Email
    const { otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    try {
        // MAGIC OTP for Test Accounts
        let isValid = false;
        if (email.endsWith('@test.com') && otp === '123456') {
            isValid = true;
        } else {
            const record = await otpModel.getLatestOtp(email);
            if (!record) return res.status(400).json({ error: 'Invalid or expired OTP' });

            isValid = await bcrypt.compare(otp, record.otp_hash);
            // Clean up used OTPs only if it was a real OTP
            if (isValid) {
                await otpModel.deleteOtps(email);
            }
        }

        if (!isValid) return res.status(400).json({ error: 'Invalid OTP' });

        // Find or Create User
        // Note: Ideally move this to userModel
        let userQuery = 'SELECT * FROM users WHERE email = $1';
        let { rows } = await db.query(userQuery, [email]);
        let user = rows[0];

        if (!user) {
            // Create new user
            // STRICT ADMIN: Only specific email gets admin access
            const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
            const role = email === ADMIN_EMAIL ? 'admin' : 'student';

            const insertQuery = `
        INSERT INTO users (name, email, role, user_status)
        VALUES ($1, $2, $3, 'active')
        RETURNING *;
      `;
            const result = await db.query(insertQuery, ['New User', email, role]);
            user = result.rows[0];
        } else {
            // CHECK STATUS FOR EXISTING USERS
            if (user.user_status === 'disabled') {
                return res.status(403).json({ error: 'Account disabled. Contact Admin.' });
            }

            // FOR EXISTING USERS: Check if they should be admin
            const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
            if (email === ADMIN_EMAIL && user.role !== 'admin') {
                const updateQuery = 'UPDATE users SET role = $1 WHERE id = $2 RETURNING *';
                const updateResult = await db.query(updateQuery, ['admin', user.id]);
                user = updateResult.rows[0];
            }
        }

        // Issue JWT
        // Issue JWT with FULL profile data
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
                enrollment_no: user.enrollment_no
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({ message: 'Login successful', token, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    requestOtp,
    verifyOtp,
};
