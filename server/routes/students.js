const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Class = require('../models/Class');
const auth = require('../middleware/auth');

// Get students with pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const totalStudents = await Student.countDocuments();
    const students = await Student.find()
      .populate('assignedClass')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      students,
      currentPage: page,
      totalPages: Math.ceil(totalStudents / limit),
      totalStudents
    });
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Add new student
router.post('/', auth, async (req, res) => {
  try {
    const { fullName, address, contactNumber, parentContact, assignedClass, totalFees } = req.body;

    if (!/^\d{10}$/.test(contactNumber)) {
      return res.status(400).json({ msg: 'Contact number must be exactly 10 digits.' });
    }
    if (parentContact && !/^\d{10}$/.test(parentContact)) {
      return res.status(400).json({ msg: 'Parent contact must be exactly 10 digits.' });
    }
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
router.put('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ msg: 'Student not found' });

    const { contactNumber, parentContact } = req.body;
    if (contactNumber && !/^\d{10}$/.test(contactNumber)) {
      return res.status(400).json({ msg: 'Contact number must be exactly 10 digits.' });
    }
    if (parentContact && !/^\d{10}$/.test(parentContact)) {
      return res.status(400).json({ msg: 'Parent contact must be exactly 10 digits.' });
    }
    
    Object.assign(student, req.body);
    const updatedStudent = await student.save();
    res.json(updatedStudent);
  } catch (err) {
    console.error("Error updating student:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete student
router.delete('/:id', auth, async (req, res) => {
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
