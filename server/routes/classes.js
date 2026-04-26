const express = require('express');
const router = express.Router();
const Class = require('../models/Class');

// Get all classes
router.get('/', async (req, res) => {
  try {
    const classes = await Class.find();
    res.json(classes);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Add new class
router.post('/', async (req, res) => {
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
router.put('/:id', async (req, res) => {
  try {
    const updatedClass = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedClass);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Delete class
router.delete('/:id', async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Class removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
