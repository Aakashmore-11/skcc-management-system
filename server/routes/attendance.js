const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');

// GET attendance for a specific class on a specific date
router.get('/class/:classId', auth, async (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD
    const classId = req.params.classId;

    if (!date) {
      return res.status(400).json({ msg: 'Date is required' });
    }

    const [year, month, day] = date.split('-').map(Number);
    const searchDate = new Date(Date.UTC(year, month - 1, day));
    
    // Get all students in the class
    const students = await Student.find({ assignedClass: classId }).sort({ fullName: 1 });
    
    // Get attendance records for this class on this date
    const attendanceRecords = await Attendance.find({
      classId,
      date: searchDate
    }).populate('markedBy', 'name username role');

    const attendanceMap = {};
    const markedByMap = {};
    const updatedAtMap = {};
    attendanceRecords.forEach(record => {
      attendanceMap[record.student.toString()] = record.status;
      markedByMap[record.student.toString()] = record.markedBy ? record.markedBy.name : 'Unknown';
      updatedAtMap[record.student.toString()] = record.updatedAt;
    });

    const result = students.map(student => ({
      studentId: student._id,
      fullName: student.fullName,
      status: attendanceMap[student._id.toString()] || '',
      markedBy: markedByMap[student._id.toString()] || 'N/A',
      updatedAt: updatedAtMap[student._id.toString()] || null
    }));

    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST mark/update attendance in bulk
router.post('/mark', auth, async (req, res) => {
  try {
    const { classId, date, attendanceData } = req.body;
    // attendanceData is an array of { studentId, status }
    
    if (!classId || !date || !attendanceData) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    const [year, month, day] = date.split('-').map(Number);
    const attendanceDate = new Date(Date.UTC(year, month - 1, day));

    const operations = attendanceData.map(record => {
      if (record.status) {
        return {
          updateOne: {
            filter: { student: record.studentId, date: attendanceDate },
            update: { 
              $set: { 
                student: record.studentId, 
                classId, 
                date: attendanceDate, 
                status: record.status,
                markedBy: req.admin.id
              } 
            },
            upsert: true
          }
        };
      } else {
        // If status is empty, remove the record if it exists
        return {
          deleteOne: {
            filter: { student: record.studentId, date: attendanceDate }
          }
        };
      }
    });

    await Attendance.bulkWrite(operations);

    // Audit Log
    const className = await Class.findById(classId).select('className');
    await AuditLog.create({ 
      adminId: req.admin.id, 
      action: req.admin.role === 'teacher' ? 'TEACHER_MARK_ATTENDANCE' : 'ADMIN_MARK_ATTENDANCE', 
      details: `Marked attendance for class: ${className?.className || 'Unknown'} on ${date}` 
    });

    res.json({ msg: 'Attendance saved successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET overall attendance statistics
router.get('/stats', auth, async (req, res) => {
  try {
    let targetDate = new Date();
    if (req.query.date) {
      const [year, month, day] = req.query.date.split('-').map(Number);
      targetDate = new Date(Date.UTC(year, month - 1, day));
    } else {
      targetDate.setUTCHours(0, 0, 0, 0);
    }

    // Teacher permission check
    if (req.admin.role === 'teacher') {
      const teacher = await Teacher.findById(req.admin.id);
      if (!teacher || !teacher.permissions.canAccessReports) {
        return res.status(403).json({ msg: 'Access Denied: You do not have permission to view reports.' });
      }
    }

    const [totalStudents, presentToday, absentToday, lateToday] = await Promise.all([
      Student.countDocuments(),
      Attendance.countDocuments({ date: targetDate, status: 'Present' }),
      Attendance.countDocuments({ date: targetDate, status: 'Absent' }),
      Attendance.countDocuments({ date: targetDate, status: 'Late' })
    ]);

    res.json({
      totalStudents,
      presentToday,
      absentToday,
      lateToday,
      unmarkedToday: totalStudents - (presentToday + absentToday + lateToday)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET student attendance report
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId).populate('assignedClass');
    if (!student) return res.status(404).json({ msg: 'Student not found' });

    const [records, statsData] = await Promise.all([
      Attendance.find({ student: req.params.studentId }).sort({ date: -1 }),
      Attendance.aggregate([
        { $match: { student: new mongoose.Types.ObjectId(req.params.studentId) } },
        { $group: {
            _id: null,
            total: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
            absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
            late: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } }
        }}
      ])
    ]);
    
    const stats = statsData[0] || { total: 0, present: 0, absent: 0, late: 0 };
    const percentage = stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0;

    res.json({
      student: {
        fullName: student.fullName,
        mobileNo: student.contactNumber,
        className: student.assignedClass.className,
        batchName: student.assignedClass.batchName,
        feesPending: student.feesPending
      },
      records,
      stats: { ...stats, percentage }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET all absentees for a date
router.get('/absentees', auth, async (req, res) => {
  try {
    const { date, classId } = req.query;
    if (!date) return res.status(400).json({ msg: 'Date is required' });

    // Teacher permission check
    if (req.admin.role === 'teacher') {
      const teacher = await Teacher.findById(req.admin.id);
      if (!teacher || !teacher.permissions.canAccessReports) {
        return res.status(403).json({ msg: 'Access Denied: You do not have permission to view reports.' });
      }
    }

    const [year, month, day] = date.split('-').map(Number);
    const targetDate = new Date(Date.UTC(year, month - 1, day));

    const query = { date: targetDate, status: 'Absent' };
    if (classId) query.classId = classId;

    const absentees = await Attendance.find(query)
      .populate('student', 'fullName contactNumber assignedClass')
      .populate('classId', 'className batchName');

    // Map contactNumber to mobileNo for frontend compatibility
    const result = absentees.map(a => {
      const obj = a.toObject();
      if (obj.student) {
        obj.student.mobileNo = obj.student.contactNumber;
      }
      return obj;
    });

    res.json(result);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// GET monthly report for a class
router.get('/report/monthly/:classId', auth, async (req, res) => {
  try {
    const { month, year } = req.query; // 1-12, e.g., 4, 2026
    if (!month || !year) return res.status(400).json({ msg: 'Month and Year are required' });

    // Teacher permission check
    if (req.admin.role === 'teacher') {
      const teacher = await Teacher.findById(req.admin.id);
      if (!teacher || !teacher.permissions.canAccessReports) {
        return res.status(403).json({ msg: 'Access Denied: You do not have permission to view reports.' });
      }
    }

    const classId = req.params.classId;

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0));

    const students = await Student.find({ assignedClass: classId }).select('fullName _id');
    const stats = await Attendance.aggregate([
      {
        $match: {
          classId: new mongoose.Types.ObjectId(classId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$student',
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } },
          total: { $sum: 1 }
        }
      }
    ]);

    const statsMap = {};
    stats.forEach(s => {
      statsMap[s._id.toString()] = s;
    });

    const report = students.map(student => {
      const s = statsMap[student._id.toString()] || { present: 0, absent: 0, late: 0, total: 0 };
      const percentage = s.total > 0 ? Math.round(((s.present + s.late) / s.total) * 100) : 0;

      return {
        studentId: student._id,
        fullName: student.fullName,
        stats: { ...s, percentage }
      };
    });

    res.json(report);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
