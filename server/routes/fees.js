const express = require('express');
const router = express.Router();
const Fee = require('../models/Fee');
const Student = require('../models/Student');

// Get all fees
router.get('/', async (req, res) => {
  try {
    const fees = await Fee.find().populate({
      path: 'student',
      populate: { path: 'assignedClass' }
    });
    res.json(fees);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Record a fee payment
router.post('/', async (req, res) => {
  try {
    const { studentId, amountPaid } = req.body;
    
    // Generate unique receipt number
    const receiptNumber = `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newFee = new Fee({
      student: studentId,
      amountPaid,
      receiptNumber
    });
    
    const fee = await newFee.save();
    
    // Update student's paid and pending fees
    const student = await Student.findById(studentId);
    if(student) {
      student.feesPaid += amountPaid;
      await student.save();
    }
    
    res.json(fee);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
