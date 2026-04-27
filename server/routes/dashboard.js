const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Fee = require('../models/Fee');
const Class = require('../models/Class');
const auth = require('../middleware/auth');

router.get('/summary', auth, async (req, res) => {
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
    
    // Total pending and expected fees
    const feeStats = await Student.aggregate([
      { $group: {
        _id: null,
        totalPendingFees: { $sum: '$feesPending' },
        totalExpectedFees: { $sum: '$totalFees' },
        pendingFeesCount: { $sum: { $cond: [{ $gt: ['$feesPending', 0] }, 1, 0] } }
      }}
    ]);
    const { totalPendingFees = 0, totalExpectedFees = 0, pendingFeesCount = 0 } = feeStats[0] || {};
    
    res.json({
      totalStudents,
      todaysCollection,
      monthlyRevenue,
      totalPendingFees,
      totalExpectedFees,
      pendingFeesCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/charts', auth, async (req, res) => {
  try {
    let targetDate = new Date();
    if (req.query.date) {
      const parsedDate = new Date(req.query.date);
      if (!isNaN(parsedDate)) targetDate = parsedDate;
    }

    // 1. Weekly Data (Last 7 Days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(targetDate);
      d.setDate(d.getDate() - i);
      d.setHours(0,0,0,0);
      const nd = new Date(d);
      nd.setDate(nd.getDate() + 1);
      
      const dayFees = await Fee.aggregate([
        { $match: { paymentDate: { $gte: d, $lt: nd } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]);
      weeklyData.push({ 
        day: d.toLocaleDateString('en-US', { weekday: 'short' }), 
        amount: dayFees[0]?.total || 0 
      });
    }

    // 2. Monthly Data (Last 4 Months)
    const monthlyData = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date(targetDate);
      d.setMonth(d.getMonth() - i);
      d.setDate(1);
      d.setHours(0,0,0,0);
      const nm = new Date(d);
      nm.setMonth(nm.getMonth() + 1);
      
      const monthFees = await Fee.aggregate([
        { $match: { paymentDate: { $gte: d, $lt: nm } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]);
      monthlyData.push({ 
        month: d.toLocaleDateString('en-US', { month: 'short' }), 
        amount: monthFees[0]?.total || 0 
      });
    }

    // 3. Collection Status (Donut Data)
    const moneyStats = await Student.aggregate([
      { $group: { 
        _id: null, 
        totalCollected: { $sum: '$feesPaid' }, 
        totalPending: { $sum: '$feesPending' } 
      }}
    ]);
    const { totalCollected = 0, totalPending = 0 } = moneyStats[0] || {};
    const totalPotential = totalCollected + totalPending || 1;
    
    const donutData = [
      { name: "Collected", value: Math.round((totalCollected / totalPotential) * 100), color: "#22d48f" },
      { name: "Pending", value: Math.round((totalPending / totalPotential) * 100), color: "#f04b4b" },
    ];

    // 4. Class Progress & 6. Student Distribution (Optimized)
    const classes = await Class.find().lean();
    const colors = ["#4f7cff", "#22d48f", "#7c5cff", "#f5a623", "#f04b4b", "#22c7d4"];
    
    // Get stats for all classes in one go
    const classStats = await Student.aggregate([
      { $group: {
        _id: '$assignedClass',
        studentCount: { $sum: 1 },
        totalFees: { $sum: '$totalFees' },
        feesPaid: { $sum: '$feesPaid' }
      }}
    ]);

    const statsMap = {};
    classStats.forEach(stat => {
      statsMap[stat._id?.toString()] = stat;
    });

    const classProgress = [];
    const studentDistribution = [];

    classes.forEach((cls, i) => {
      const stats = statsMap[cls._id.toString()] || { studentCount: 0, totalFees: 0, feesPaid: 0 };
      const color = colors[i % colors.length];

      // Progress
      const pct = stats.totalFees > 0 ? Math.round((stats.feesPaid / stats.totalFees) * 100) : 0;
      classProgress.push({ name: cls.className, collected: pct, color });

      // Distribution
      studentDistribution.push({ className: cls.className, count: stats.studentCount, color });
    });

    // 5. Recent Payments
    const recentDocs = await Fee.find().sort({ paymentDate: -1 }).limit(5).populate({
      path: 'student',
      populate: { path: 'assignedClass' }
    });
    
    const recentPayments = recentDocs.map((f, i) => {
      const s = f.student;
      return {
        id: f.receiptNumber,
        name: s?.fullName || 'Unknown',
        initials: s?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'NA',
        cls: s?.assignedClass?.className || 'N/A',
        amount: f.amountPaid,
        date: new Date(f.paymentDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        status: (s && s.feesPending > 0) ? 'Partial' : 'Paid',
        bg: colors[i % colors.length]
      };
    });

    res.json({
      weeklyData,
      monthlyData,
      donutData,
      classProgress: classProgress.slice(0, 4),
      recentPayments,
      studentDistribution
    });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
