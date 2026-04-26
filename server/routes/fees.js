const express = require('express');
const router = express.Router();
const Fee = require('../models/Fee');
const Student = require('../models/Student');
const Class = require('../models/Class');
const auth = require('../middleware/auth');

// Get all fees
router.get('/', auth, async (req, res) => {
  try {
    const fees = await Fee.find()
      .populate({
        path: 'student',
        populate: { 
          path: 'assignedClass',
          model: 'Class'
        }
      })
      .exec();
    res.json(fees);
  } catch (err) {
    console.error("Error fetching fees:", err);
    res.status(500).json({ 
      error: err.message, 
      stack: err.stack
    });
  }
});

// Record a fee payment
router.post('/', auth, async (req, res) => {
  try {
    const { studentId, amountPaid } = req.body;
    
    if (!studentId || !amountPaid) {
      return res.status(400).json({ error: "Student ID and Amount Paid are required." });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // 1. Update student's financial record
    student.feesPaid = (student.feesPaid || 0) + Number(amountPaid);
    await student.save(); // This triggers the pre-save middleware to update feesPending

    // 2. Generate unique receipt number
    const receiptNumber = `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 3. Create Fee record with snapshot of the remaining balance at THIS moment
    const newFee = new Fee({
      student: studentId,
      amountPaid: Number(amountPaid),
      remainingBalance: student.feesPending,
      receiptNumber
    });
    
    const fee = await newFee.save();
    
    res.json(fee);
  } catch (err) {
    console.error("Error recording fee:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

module.exports = router;
