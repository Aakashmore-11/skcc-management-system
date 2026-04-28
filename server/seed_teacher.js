const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Teacher = require('./models/Teacher');
require('dotenv').config();

const seedTeacher = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skcc_ms');
    console.log('MongoDB connected');

    const username = 'teacher';
    const newPassword = 'password123';
    const name = 'John Doe';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const teacher = await Teacher.findOneAndUpdate(
      { username },
      { password: hashedPassword, name },
      { new: true, upsert: true }
    );

    console.log(`Teacher seeded! Username: ${teacher.username}, Password: ${newPassword}`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedTeacher();
