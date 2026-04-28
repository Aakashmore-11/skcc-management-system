const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  action: { type: String, required: true },
  details: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
