const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Fee = require('../models/Fee');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

router.get('/summary', [auth, adminOnly], async (req, res) => {
  try {
    let targetDate = new Date();
    if (req.query.date) {
      const [y, m, d] = req.query.date.split('-').map(Number);
      targetDate = new Date(Date.UTC(y, m - 1, d));
    } else {
      targetDate.setUTCHours(0, 0, 0, 0);
    }

    const startOfDay = new Date(targetDate);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    const startOfMonth = new Date(targetDate);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const startOfYesterday = new Date(startOfDay);
    startOfYesterday.setUTCDate(startOfYesterday.getUTCDate() - 1);
    const endOfYesterday = new Date(startOfDay);

    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setUTCMonth(startOfLastMonth.getUTCMonth() - 1);
    const endOfLastMonth = new Date(startOfMonth);

    const [
      totalStudents,
      newStudentsThisMonth,
      todaysFees,
      yesterdayFees,
      monthlyFees,
      lastMonthFees,
      feeStats,
      presentToday,
      absentToday,
      lateToday
    ] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ admissionDate: { $gte: startOfMonth } }),
      Fee.aggregate([
        { $match: { paymentDate: { $gte: startOfDay, $lt: endOfDay } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]),
      Fee.aggregate([
        { $match: { paymentDate: { $gte: startOfYesterday, $lt: endOfYesterday } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]),
      Fee.aggregate([
        { $match: { paymentDate: { $gte: startOfMonth, $lt: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]),
      Fee.aggregate([
        { $match: { paymentDate: { $gte: startOfLastMonth, $lt: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]),
      Student.aggregate([
        { $group: {
          _id: null,
          totalPendingFees: { $sum: '$feesPending' },
          totalExpectedFees: { $sum: '$totalFees' },
          pendingFeesCount: { $sum: { $cond: [{ $gt: ['$feesPending', 0] }, 1, 0] } }
        }}
      ]),
      Attendance.countDocuments({ date: startOfDay, status: 'Present' }),
      Attendance.countDocuments({ date: startOfDay, status: 'Absent' }),
      Attendance.countDocuments({ date: startOfDay, status: 'Late' })
    ]);

    const todaysCollection = todaysFees.length > 0 ? todaysFees[0].total : 0;
    const yesterdayCollection = yesterdayFees.length > 0 ? yesterdayFees[0].total : 0;
    const monthlyRevenue = monthlyFees.length > 0 ? monthlyFees[0].total : 0;
    const lastMonthRevenue = lastMonthFees.length > 0 ? lastMonthFees[0].total : 0;
    
    const collectionDiff = todaysCollection - yesterdayCollection;
    const revenueDiff = lastMonthRevenue > 0 ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0;

    const { totalPendingFees = 0, totalExpectedFees = 0, pendingFeesCount = 0 } = feeStats[0] || {};
    
    res.json({
      totalStudents,
      newStudentsThisMonth,
      todaysCollection,
      collectionDiff,
      monthlyRevenue,
      revenueDiff,
      totalPendingFees,
      totalExpectedFees,
      pendingFeesCount,
      presentToday,
      absentToday,
      lateToday
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/charts', [auth, adminOnly], async (req, res) => {
  try {
    let targetDate = new Date();
    if (req.query.date) {
      const [y, m, d] = req.query.date.split('-').map(Number);
      targetDate = new Date(Date.UTC(y, m - 1, d));
    } else {
      targetDate.setUTCHours(0, 0, 0, 0);
    }

    // 1. Weekly Data (Last 7 Days)
    const startOfWeekly = new Date(targetDate);
    startOfWeekly.setUTCDate(startOfWeekly.getUTCDate() - 6);
    startOfWeekly.setUTCHours(0, 0, 0, 0);
    const endOfWeekly = new Date(targetDate);
    endOfWeekly.setUTCDate(endOfWeekly.getUTCDate() + 1);
    endOfWeekly.setUTCHours(0, 0, 0, 0);

    const weeklyFeesRaw = await Fee.aggregate([
      { $match: { paymentDate: { $gte: startOfWeekly, $lt: endOfWeekly } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$paymentDate" } },
          total: { $sum: '$amountPaid' }
      }}
    ]);

    const weeklyMap = {};
    weeklyFeesRaw.forEach(f => weeklyMap[f._id] = f.total);

    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(targetDate);
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      weeklyData.push({ 
        day: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }), 
        amount: weeklyMap[dateStr] || 0 
      });
    }

    // 2. Monthly Data (Last 4 Months)
    const startOfMonthly = new Date(targetDate);
    startOfMonthly.setUTCDate(1); // Set to 1st first to avoid month-end bugs
    startOfMonthly.setUTCMonth(startOfMonthly.getUTCMonth() - 3);
    startOfMonthly.setUTCHours(0,0,0,0);
    const endOfMonthly = new Date(targetDate);
    endOfMonthly.setUTCDate(1);
    endOfMonthly.setUTCMonth(endOfMonthly.getUTCMonth() + 1);
    endOfMonthly.setUTCHours(0,0,0,0);

    const monthlyFeesRaw = await Fee.aggregate([
      { $match: { paymentDate: { $gte: startOfMonthly, $lt: endOfMonthly } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$paymentDate" } },
          total: { $sum: '$amountPaid' }
      }}
    ]);

    const monthlyMap = {};
    monthlyFeesRaw.forEach(f => monthlyMap[f._id] = f.total);

    const monthlyData = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date(targetDate);
      d.setUTCDate(1);
      d.setUTCMonth(d.getUTCMonth() - i);
      const monthStr = d.toISOString().split('-').slice(0, 2).join('-');
      monthlyData.push({ 
        month: d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }), 
        amount: monthlyMap[monthStr] || 0 
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
