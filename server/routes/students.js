const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Class = require('../models/Class');
const Fee = require('../models/Fee');
const Attendance = require('../models/Attendance');
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// Get students with pagination
router.get('/', [auth, adminOnly], async (req, res) => {
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
router.post('/', [auth, adminOnly], async (req, res) => {
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
router.put('/:id', [auth, adminOnly], async (req, res) => {
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

// @route   DELETE api/students/:id
// @desc    Delete a student and their related data
router.delete('/:id', [auth, adminOnly], async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await Student.findById(studentId);
    
    if (!student) return res.status(404).json({ msg: 'Student not found' });
    
    // Update class count
    await Class.findByIdAndUpdate(student.assignedClass, { $inc: { totalStudents: -1 } });

    // Delete related records
    await Promise.all([
      Fee.deleteMany({ student: studentId }),
      Attendance.deleteMany({ student: studentId })
    ]);
    
    await Student.findByIdAndDelete(studentId);

    // Log deletion
    try {
      await AuditLog.create({ 
        adminId: req.admin.id, 
        action: 'DELETE_STUDENT', 
        details: `Deleted student: ${student.fullName} (ID: ${studentId}) and all associated records.` 
      });
    } catch(e) { console.error('Audit Log Error:', e) }

    res.json({ msg: 'Student and associated data deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
