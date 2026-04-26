const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    let admin = await Admin.findOne({ username });
    
    // For development: auto-create admin if it doesn't exist
    if (!admin) {
      if (username === 'admin' && password === 'admin') {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        admin = new Admin({ username, password: hashedPassword });
        await admin.save();
      } else {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }
    } else {
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = { admin: { id: admin.id } };
    jwt.sign(payload, process.env.JWT_SECRET || 'secretToken', { expiresIn: 360000 }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
