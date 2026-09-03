const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// Admin Login
exports.login = async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ message: 'User ID and password are required' });
    }

    const admin = await Admin.findOne({ userId }).select('+password');
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(admin._id, 'admin');

    res.json({
      token,
      admin: {
        id: admin._id,
        userId: admin.userId,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get admin profile
exports.getProfile = async (req, res) => {
  try {
    res.json({
      id: req.admin._id,
      userId: req.admin.userId,
      name: req.admin.name,
      role: req.admin.role,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all registered users (for payment approval)
exports.getPendingUsers = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : { status: { $in: ['pending', 'approved', 'rejected'] } };
    const users = await User.find(filter).sort({ createdAt: -1 });

    res.json(users.map(u => ({
      id: u._id,
      fullName: u.fullName,
      mobile: u.mobile,
      status: u.status,
      rejectionReason: u.rejectionReason,
      createdAt: u.createdAt,
      referralCode: u.referralCode,
      address: u.address,
      kyc: u.kyc,
      paymentScreenshot: u.paymentScreenshot,
    })));
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single user full details
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      id: user._id,
      fullName: user.fullName,
      mobile: user.mobile,
      status: user.status,
      rejectionReason: user.rejectionReason,
      createdAt: user.createdAt,
      referralCode: user.referralCode,
      address: user.address,
      kyc: user.kyc,
      paymentScreenshot: user.paymentScreenshot,
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve or reject user registration
exports.updateUserStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    if (status === 'rejected' && reason && reason.trim().length > 500) {
      return res.status(400).json({ message: 'Reason must be under 500 characters' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.status = status;
    user.rejectionReason = status === 'rejected' ? (reason || '').trim() : '';
    await user.save();

    res.json({
      id: user._id,
      fullName: user.fullName,
      status: user.status,
      rejectionReason: user.rejectionReason,
      message: status === 'approved' ? 'User approved' : 'User rejected',
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
