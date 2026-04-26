const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Fee = require('../models/Fee');
const Class = require('../models/Class');

router.get('/summary', async (req, res) => {
  try {
    let targetDate = new Date();
    if (req.query.date) {
      const parsedDate = new Date(req.query.date);
      if (!isNaN(parsedDate)) targetDate = parsedDate;
    }

    const totalStudents = await Student.countDocuments();
    
    // Today's collection
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const todaysFees = await Fee.aggregate([
      { $match: { paymentDate: { $gte: startOfDay, $lt: endOfDay } } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } }
    ]);
    const todaysCollection = todaysFees.length > 0 ? todaysFees[0].total : 0;
    
    // Monthly revenue
    const startOfMonth = new Date(targetDate);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const monthlyFees = await Fee.aggregate([
      { $match: { paymentDate: { $gte: startOfMonth, $lt: endOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } }
    ]);
    const monthlyRevenue = monthlyFees.length > 0 ? monthlyFees[0].total : 0;
    
    // Total pending fees
    const students = await Student.find();
    const totalPendingFees = students.reduce((acc, curr) => acc + (curr.feesPending || 0), 0);
    
    res.json({
      totalStudents,
      todaysCollection,
      monthlyRevenue,
      totalPendingFees
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/charts', async (req, res) => {
  try {
    let targetDate = new Date();
    if (req.query.date) {
      const parsedDate = new Date(req.query.date);
      if (!isNaN(parsedDate)) targetDate = parsedDate;
    }

    // 1. Weekly Data (Last 7 Days relative to targetDate)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(targetDate);
      date.setDate(date.getDate() - i);
      date.setHours(0,0,0,0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayFees = await Fee.aggregate([
        { $match: { paymentDate: { $gte: date, $lt: nextDate } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      weeklyData.push({ day: dayName, amount: dayFees.length > 0 ? dayFees[0].total : 0 });
    }

    // 2. Monthly Data (Last 4 Months relative to targetDate)
    const monthlyData = [];
    for (let i = 3; i >= 0; i--) {
      const date = new Date(targetDate);
      date.setMonth(date.getMonth() - i);
      date.setDate(1);
      date.setHours(0,0,0,0);
      const nextMonth = new Date(date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const monthFees = await Fee.aggregate([
        { $match: { paymentDate: { $gte: date, $lt: nextMonth } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      monthlyData.push({ month: monthName, amount: monthFees.length > 0 ? monthFees[0].total : 0 });
    }

    // 3. Payment Status (Donut Data)
    const students = await Student.find();
    let paidCount = 0, partialCount = 0, pendingCount = 0;
    
    students.forEach(s => {
      if (s.feesPaid === 0) pendingCount++;
      else if (s.feesPending === 0) paidCount++;
      else partialCount++;
    });
    
    const totalS = students.length || 1;
    const donutData = [
      { name: "Paid", value: Math.round((paidCount / totalS) * 100) || 0, color: "#4f7cff" },
      { name: "Partial", value: Math.round((partialCount / totalS) * 100) || 0, color: "#f5a623" },
      { name: "Pending", value: Math.round((pendingCount / totalS) * 100) || 0, color: "#f04b4b" },
    ];

    // 4. Class Progress
    const classes = await Class.find();
    const classProgress = [];
    const colors = ["#4f7cff", "#22d48f", "#7c5cff", "#f5a623", "#f04b4b", "#22c7d4"];
    
    for (let i = 0; i < classes.length; i++) {
      const cls = classes[i];
      const clsStudents = await Student.find({ assignedClass: cls._id });
      const clsTotal = clsStudents.reduce((acc, s) => acc + s.totalFees, 0);
      const clsPaid = clsStudents.reduce((acc, s) => acc + s.feesPaid, 0);
      
      const pct = clsTotal > 0 ? Math.round((clsPaid / clsTotal) * 100) : 0;
      
      classProgress.push({
        name: cls.className,
        collected: pct,
        color: colors[i % colors.length]
      });
    }

    // 5. Recent Payments
    const recentDocs = await Fee.find().sort({ paymentDate: -1 }).limit(5).populate({
      path: 'student',
      populate: { path: 'assignedClass' }
    });
    
    const recentPayments = recentDocs.map((f, i) => {
      const s = f.student;
      const initials = s ? s.fullName.substring(0, 2).toUpperCase() : 'NA';
      const className = s && s.assignedClass ? s.assignedClass.className : 'N/A';
      
      let status = 'Paid';
      if (s && s.feesPending > 0) status = 'Partial';
      
      return {
        id: f.receiptNumber,
        name: s ? s.fullName : 'Unknown',
        initials,
        cls: className,
        amount: f.amountPaid,
        date: new Date(f.paymentDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        status,
        bg: colors[i % colors.length]
      };
    });

    res.json({
      weeklyData,
      monthlyData,
      donutData,
      classProgress: classProgress.slice(0, 4), // Top 4
      recentPayments
    });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
