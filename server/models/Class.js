const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  className: { type: String, required: true }, // e.g., '10th', '11th', 'B.Com'
  batchName: { type: String, required: true }, // e.g., 'Morning', 'Evening'
  fees: { type: Number, required: true },
  totalStudents: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Class', ClassSchema);
