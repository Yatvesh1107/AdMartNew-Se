const mongoose = require('mongoose');

const qrSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Payment QR',
  },
  image: {
    type: String,
    required: [true, 'QR image is required'],
  },
  upiId: {
    type: String,
    default: '',
  },
  amount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('QrCode', qrSchema);
