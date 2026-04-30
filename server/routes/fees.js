const express = require('express');
const router = express.Router();
const Fee = require('../models/Fee');
const Student = require('../models/Student');
const Class = require('../models/Class');
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// Get all fees
router.get('/', [auth, adminOnly], async (req, res) => {
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
router.post('/', [auth, adminOnly], async (req, res) => {
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
    const amount = Number(amountPaid);
    if (amount <= 0) {
      return res.status(400).json({ error: "Amount Paid must be greater than 0." });
    }

    student.feesPaid = (student.feesPaid || 0) + amount;
    await student.save(); // This triggers the pre-save middleware to update feesPending

    // 2. Generate unique receipt number
    const receiptNumber = `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 3. Create Fee record with snapshot of the remaining balance at THIS moment
    const newFee = new Fee({
      student: studentId,
      amountPaid: amount,
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

// Delete a fee record
router.delete('/:id', [auth, adminOnly], async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ error: "Fee record not found" });

    const student = await Student.findById(fee.student);
    if (student) {
      student.feesPaid = Math.max(0, (student.feesPaid || 0) - fee.amountPaid);
      await student.save();
    }

    await Fee.findByIdAndDelete(req.params.id);

    // Log deletion
    try {
      await AuditLog.create({ 
        adminId: req.admin.id, 
        action: 'DELETE_FEE', 
        details: `Deleted fee record ${fee.receiptNumber} for student ${student?.fullName || 'Unknown'}. Amount: ₹${fee.amountPaid}` 
      });
    } catch(e) { console.error('Audit Log Error:', e) }

    res.json({ msg: 'Fee record removed and student balance updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
