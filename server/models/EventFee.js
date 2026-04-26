const mongoose = require('mongoose');

const eventFeeSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  amountPaid: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  receiptNumber: { type: String, unique: true }
});

eventFeeSchema.pre('save', function() {
  if (!this.receiptNumber) {
    this.receiptNumber = 'EVT-' + Math.floor(100000 + Math.random() * 900000);
  }
});

module.exports = mongoose.model('EventFee', eventFeeSchema);
