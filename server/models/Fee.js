const mongoose = require('mongoose');

const FeeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  amountPaid: { type: Number, required: true },
  remainingBalance: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  receiptNumber: { type: String, required: true, unique: true }
}, { timestamps: true });

// Index for faster dashboard queries
FeeSchema.index({ paymentDate: 1 });

module.exports = mongoose.model('Fee', FeeSchema);
