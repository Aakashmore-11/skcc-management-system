const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const Student = require('../models/Student');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// Get all classes
router.get('/', auth, async (req, res) => {
  try {
    const classes = await Class.find();
    res.json(classes);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Add new class
router.post('/', [auth, adminOnly], async (req, res) => {
  try {
    const { className, batchName, fees } = req.body;
    const newClass = new Class({ className, batchName, fees });
    const classObj = await newClass.save();
    res.json(classObj);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Update class
router.put('/:id', auth, async (req, res) => {
  try {
    const updatedClass = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedClass);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Delete class
router.delete('/:id', [auth, adminOnly], async (req, res) => {
  try {
    const classId = req.params.id;
    // Unassign students from this class
    await Student.updateMany({ assignedClass: classId }, { $set: { assignedClass: null } });
    
    await Class.findByIdAndDelete(classId);
    res.json({ msg: 'Class removed and students unassigned' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
