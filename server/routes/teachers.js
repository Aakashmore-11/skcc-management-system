const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const AuditLog = require('../models/AuditLog'); // We will create this

// Helper to log audit
const logAudit = async (adminId, action, details) => {
  try {
    await AuditLog.create({ adminId, action, details });
  } catch (err) {
    console.error('Audit Log Error:', err);
  }
};

// @route   POST api/teachers/login
// @desc    Authenticate teacher & get token
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    let teacher = await Teacher.findOne({ username });
    if (!teacher) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }
    
    if (!teacher.isActive) {
      return res.status(403).json({ msg: 'Account deactivated. Contact Admin.' });
    }

    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    // Payload can be shared with auth middleware if we want teachers to access attendance routes
    // For now, let's just make the payload generic or use same secret
    const payload = { admin: { id: teacher.id, role: 'teacher' } };
    jwt.sign(payload, process.env.JWT_SECRET || 'secretToken', { expiresIn: 360000 }, (err, token) => {
      if (err) throw err;
      res.json({ token, name: teacher.name });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Admin routes for Teacher Credential Management
// @route   GET api/teachers
router.get('/', auth, async (req, res) => {
  try {
    const teachers = await Teacher.find().select('-password').sort({ createdAt: -1 });
    res.json(teachers);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST api/teachers
router.post('/', auth, async (req, res) => {
  try {
    const { name, username, password, role } = req.body;
    let teacher = await Teacher.findOne({ username });
    if (teacher) return res.status(400).json({ msg: 'Teacher already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    teacher = new Teacher({ name, username, password: hashedPassword, role });
    await teacher.save();

    await logAudit(req.admin.id, 'CREATE_TEACHER', `Created teacher account: ${username}`);
    res.json(teacher);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/teachers/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, username, password, isActive, role } = req.body;
    let teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ msg: 'Teacher not found' });

    if (name) teacher.name = name;
    if (username) teacher.username = username;
    if (isActive !== undefined) teacher.isActive = isActive;
    if (role) teacher.role = role;
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      teacher.password = await bcrypt.hash(password, salt);
    }

    await teacher.save();
    await logAudit(req.admin.id, 'UPDATE_TEACHER', `Updated teacher account: ${teacher.username}`);
    res.json(teacher);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/teachers/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ msg: 'Teacher not found' });

    await Teacher.findByIdAndDelete(req.params.id);
    await logAudit(req.admin.id, 'DELETE_TEACHER', `Deleted teacher account: ${teacher.username}`);
    res.json({ msg: 'Teacher removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
