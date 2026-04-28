const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Class = require('../models/Class');

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

    const totalStudents = await Student.countDocuments();
    const presentToday = await Attendance.countDocuments({ date: targetDate, status: 'Present' });
    const absentToday = await Attendance.countDocuments({ date: targetDate, status: 'Absent' });
    const lateToday = await Attendance.countDocuments({ date: targetDate, status: 'Late' });

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

    const records = await Attendance.find({ student: req.params.studentId }).sort({ date: -1 });
    
    const total = records.length;
    const present = records.filter(r => r.status === 'Present').length;
    const absent = records.filter(r => r.status === 'Absent').length;
    const late = records.filter(r => r.status === 'Late').length;

    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    res.json({
      student: {
        fullName: student.fullName,
        mobileNo: student.contactNumber,
        className: student.assignedClass.className,
        batchName: student.assignedClass.batchName,
        feesPending: student.feesPending
      },
      records,
      stats: { total, present, absent, late, percentage }
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

    const [year, month, day] = date.split('-').map(Number);
    const targetDate = new Date(Date.UTC(year, month - 1, day));

    const query = { date: targetDate, status: 'Absent' };
    if (classId) query.classId = classId;

    const absentees = await Attendance.find(query)
      .populate('student', 'fullName mobileNo assignedClass')
      .populate('classId', 'className batchName');

    res.json(absentees);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// GET monthly report for a class
router.get('/report/monthly/:classId', auth, async (req, res) => {
  try {
    const { month, year } = req.query; // 1-12, e.g., 4, 2026
    const classId = req.params.classId;

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0));

    const students = await Student.find({ assignedClass: classId }).select('fullName _id');
    const records = await Attendance.find({
      classId,
      date: { $gte: startDate, $lte: endDate }
    });

    const report = students.map(student => {
      const studentRecords = records.filter(r => r.student.toString() === student._id.toString());
      const present = studentRecords.filter(r => r.status === 'Present').length;
      const absent = studentRecords.filter(r => r.status === 'Absent').length;
      const late = studentRecords.filter(r => r.status === 'Late').length;
      const total = studentRecords.length;
      const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

      return {
        studentId: student._id,
        fullName: student.fullName,
        stats: { present, absent, late, total, percentage }
      };
    });

    res.json(report);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
