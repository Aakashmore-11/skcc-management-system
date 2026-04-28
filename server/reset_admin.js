const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');
require('dotenv').config();

const resetPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skcc_ms');
    console.log('MongoDB connected');

    const username = 'admin';
    const newPassword = 'password123'; // Default password

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const admin = await Admin.findOneAndUpdate(
      { username },
      { password: hashedPassword },
      { new: true, upsert: true }
    );

    console.log(`Password reset successful!`);
    console.log(`Username: ${admin.username}`);
    console.log(`New Password: ${newPassword}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
};

resetPassword();
