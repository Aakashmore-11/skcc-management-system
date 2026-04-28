const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
const Student = require('./models/Student');

async function check() {
  await mongoose.connect('mongodb://localhost:27017/skcc'); // Assuming local for now, but I should check env
  
  const all = await Attendance.find().populate('student');
  console.log('--- ALL ATTENDANCE ---');
  all.forEach(a => {
    console.log(`${a.date.toISOString()} | ${a.student.fullName} | ${a.status}`);
  });
  
  const today = new Date();
  today.setHours(0,0,0,0);
  console.log('\n--- TODAY (Server Local) ---');
  console.log(today.toISOString());
  
  const counts = {
    present: await Attendance.countDocuments({ date: today, status: 'Present' }),
    absent: await Attendance.countDocuments({ date: today, status: 'Absent' }),
    late: await Attendance.countDocuments({ date: today, status: 'Late' }),
  };
  console.log('\n--- COUNTS ---');
  console.log(counts);
  
  process.exit();
}

check();
