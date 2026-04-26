const mongoose = require('mongoose');

const eventExpenseSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  expenseDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EventExpense', eventExpenseSchema);
