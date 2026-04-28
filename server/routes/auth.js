const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');
const { sendOTP } = require('../utils/mailer');
const crypto = require('crypto');

// @route   POST api/auth/login
// @desc    Authenticate admin & get token
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    let admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    const payload = { admin: { id: admin.id } };
    jwt.sign(payload, process.env.JWT_SECRET || 'secretToken', { expiresIn: 360000 }, async (err, token) => {
      if (err) throw err;
      
      // Log login
      try {
        await AuditLog.create({ adminId: admin.id, action: 'ADMIN_LOGIN', details: `Admin logged in from IP: ${req.ip || 'Unknown'}` });
      } catch(e) { console.error(e) }

      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/request-otp
// @desc    Generate OTP for credential update
router.post('/request-otp', auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ msg: 'Admin not found' });

    // Rate limiting: 60 seconds between OTP requests
    const cooldown = 60 * 1000;
    if (admin.lastOtpRequest && (Date.now() - admin.lastOtpRequest < cooldown)) {
      const remaining = Math.ceil((cooldown - (Date.now() - admin.lastOtpRequest)) / 1000);
      return res.status(429).json({ msg: `Please wait ${remaining} seconds before requesting another code.` });
    }

    // Generate cryptographically secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    admin.otp = otp;
    admin.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    admin.otpAttempts = 0; // Reset attempts for new OTP
    admin.lastOtpRequest = Date.now();

    await admin.save();

    // Send OTP to hardcoded email
    const recipientEmail = 'moreaakash48@gmail.com';
    const emailSent = await sendOTP(recipientEmail, otp);

    // console.log(`Update OTP for ${admin.username}: ${otp}`); // Removed for security
    res.json({
      msg: emailSent ? 'Verification code sent to your registered email' : 'Failed to send verification email. Please check server logs.',
      emailSent
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/auth/update
// @desc    Update admin credentials
router.put('/update', auth, async (req, res) => {
  try {
    const { username, password, email, otp } = req.body;
    let admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ msg: 'Admin not found' });

    if (password && password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
    }

    // Verify OTP
    if (!admin.otp || Date.now() > admin.otpExpires) {
      return res.status(400).json({ msg: 'No active verification code found or it has expired.' });
    }

    if (admin.otpAttempts >= 5) {
      admin.otp = undefined; // Lock out the current OTP
      await admin.save();
      return res.status(403).json({ msg: 'Too many failed attempts. Please request a new code.' });
    }

    if (otp !== admin.otp) {
      admin.otpAttempts += 1;
      await admin.save();
      return res.status(400).json({ msg: 'Invalid verification code.' });
    }

    if (username) admin.username = username;
    if (email) admin.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(password, salt);
    }

    // Clear security fields after use
    admin.otp = undefined;
    admin.otpExpires = undefined;
    admin.otpAttempts = 0;

    await admin.save();
    res.json({ msg: 'Credentials updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/me
// @desc    Get current admin info
router.get('/me', auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password -otp -otpExpires');
    res.json(admin);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
