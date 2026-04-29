const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  role: { type: String, default: 'Teacher' },
  permissions: {
    canAccessReports: { type: Boolean, default: false }
  }
}, { timestamps: true });

module.exports = mongoose.model('Teacher', TeacherSchema);
