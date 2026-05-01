const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

async function checkAdmins() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skcc');
    const admins = await Admin.find().select('-password -otp -otpExpires');
    console.log('--- ADMINS ---');
    console.log(JSON.stringify(admins, null, 2));
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkAdmins();
