const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Class = require('../models/Class');

// Get all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find().populate('assignedClass');
    res.json(students);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Add new student
router.post('/', async (req, res) => {
  try {
    const { fullName, address, contactNumber, parentContact, assignedClass, totalFees } = req.body;
    const newStudent = new Student({
      fullName, address, contactNumber, parentContact, assignedClass, totalFees, feesPending: totalFees
    });
    
    const student = await newStudent.save();
    
    // Update class count
    await Class.findByIdAndUpdate(assignedClass, { $inc: { totalStudents: 1 } });
    
    res.json(student);
  } catch (err) {
    console.error("Error saving student:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Update student
router.put('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ msg: 'Student not found' });
    
    Object.assign(student, req.body);
    const updatedStudent = await student.save();
    res.json(updatedStudent);
  } catch (err) {
    console.error("Error updating student:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ msg: 'Student not found' });
    
    await Class.findByIdAndUpdate(student.assignedClass, { $inc: { totalStudents: -1 } });
    await student.deleteOne();
    
    res.json({ msg: 'Student removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
