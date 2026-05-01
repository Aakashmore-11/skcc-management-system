const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');
require('dotenv').config();

async function checkTeachers() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skcc');
    const teachers = await Teacher.find().select('-password');
    console.log('--- TEACHERS ---');
    console.log(JSON.stringify(teachers, null, 2));
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkTeachers();
