const multer = require('multer');
const path = require('path');
const QrCode = require('../models/QrCode');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'qr-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

// Get active QR code (for user registration)
exports.getActiveQr = async (req, res) => {
  try {
    const qr = await QrCode.findOne({ isActive: true }).sort({ createdAt: -1 });
    if (!qr) {
      return res.status(404).json({ message: 'No active QR code available' });
    }
    res.json({
      id: qr._id,
      title: qr.title,
      image: `/uploads/${qr.image}`,
      upiId: qr.upiId,
      amount: qr.amount,
    });
  } catch (error) {
    console.error('Get QR error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all QR codes (admin)
exports.getAllQr = async (req, res) => {
  try {
    const qrs = await QrCode.find().sort({ createdAt: -1 });
    res.json(qrs.map(qr => ({
      id: qr._id,
      title: qr.title,
      image: `/uploads/${qr.image}`,
      upiId: qr.upiId,
      amount: qr.amount,
      isActive: qr.isActive,
      createdAt: qr.createdAt,
    })));
  } catch (error) {
    console.error('Get all QR error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload new QR code (admin)
exports.uploadQr = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'QR image is required' });
    }

    const { title, upiId, amount } = req.body;

    const qr = await QrCode.create({
      title: title || 'Payment QR',
      image: req.file.filename,
      upiId: upiId || '',
      amount: amount || 0,
      isActive: true,
    });

    res.status(201).json({
      id: qr._id,
      title: qr.title,
      image: `/uploads/${qr.image}`,
      upiId: qr.upiId,
      amount: qr.amount,
      isActive: qr.isActive,
    });
  } catch (error) {
    console.error('Upload QR error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle QR active status (admin)
exports.toggleQr = async (req, res) => {
  try {
    const qr = await QrCode.findById(req.params.id);
    if (!qr) {
      return res.status(404).json({ message: 'QR code not found' });
    }

    qr.isActive = !qr.isActive;
    await qr.save();

    res.json({
      id: qr._id,
      title: qr.title,
      isActive: qr.isActive,
      message: qr.isActive ? 'QR activated' : 'QR deactivated',
    });
  } catch (error) {
    console.error('Toggle QR error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete QR code (admin)
exports.deleteQr = async (req, res) => {
  try {
    const qr = await QrCode.findByIdAndDelete(req.params.id);
    if (!qr) {
      return res.status(404).json({ message: 'QR code not found' });
    }
    res.json({ message: 'QR code deleted' });
  } catch (error) {
    console.error('Delete QR error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.upload = upload;
