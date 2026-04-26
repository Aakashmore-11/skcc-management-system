const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  contactNumber: { type: String, required: true },
  parentContact: { type: String },
  admissionDate: { type: Date, default: Date.now },
  assignedClass: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  totalFees: { type: Number, required: true, default: 0 },
  feesPaid: { type: Number, default: 0 },
  feesPending: { type: Number, default: 0 }
}, { timestamps: true });

// Pre-save middleware to calculate pending fees
StudentSchema.pre('save', function(next) {
  this.feesPaid = this.feesPaid || 0;
  this.totalFees = this.totalFees || 0;
  this.feesPending = this.totalFees - this.feesPaid;
  next();
});

module.exports = mongoose.model('Student', StudentSchema);
