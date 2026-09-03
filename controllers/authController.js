const jwt = require('jsonwebtoken');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
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

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// User Login (mobile + password)
exports.login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({ message: 'Mobile number and password are required' });
    }

    const user = await User.findOne({ mobile }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid mobile or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid mobile or password' });
    }

    const token = generateToken(user._id, 'user');

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        mobile: user.mobile,
        status: user.status,
        rejectionReason: user.rejectionReason,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// User Registration
exports.register = async (req, res) => {
  try {
    const {
      fullName, mobile, password, confirmPassword,
      house, street, locality, city, state, pincode,
      aadhaarNumber, panNumber,
      referralCode,
    } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ message: 'Full name is required' });
    }

    if (!mobile || !mobile.trim()) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }

    if (!/^[0-9]{10}$/.test(mobile.trim())) {
      return res.status(400).json({ message: 'Enter a valid 10-digit mobile number' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ message: 'Mobile number already registered' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (!confirmPassword) {
      return res.status(400).json({ message: 'Confirm password is required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const files = req.files || {};

    if (!aadhaarNumber || !aadhaarNumber.trim()) {
      return res.status(400).json({ message: 'Aadhaar number is required' });
    }

    if (!/^[0-9]{12}$/.test(aadhaarNumber.trim())) {
      return res.status(400).json({ message: 'Enter a valid 12-digit Aadhaar number' });
    }

    if (!files.aadhaarFront || files.aadhaarFront[0].filename === '') {
      return res.status(400).json({ message: 'Aadhaar front photo is required' });
    }

    if (!files.aadhaarBack || files.aadhaarBack[0].filename === '') {
      return res.status(400).json({ message: 'Aadhaar back photo is required' });
    }

    const userData = {
      fullName,
      mobile,
      password,
      address: { house, street, locality, city, state, pincode },
      kyc: {
        aadhaarNumber: aadhaarNumber || '',
        panNumber: panNumber || '',
        aadhaarFront: files.aadhaarFront ? files.aadhaarFront[0].filename : '',
        aadhaarBack: files.aadhaarBack ? files.aadhaarBack[0].filename : '',
        panPhoto: files.panPhoto ? files.panPhoto[0].filename : '',
      },
      referralCode: referralCode || '',
      paymentScreenshot: files.paymentScreenshot ? files.paymentScreenshot[0].filename : '',
      status: 'pending',
    };

    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) userData.referredBy = referrer._id;
    }

    const user = await User.create(userData);

    const token = generateToken(user._id, 'user');

    res.status(201).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        mobile: user.mobile,
        status: user.status,
      },
      message: 'Registration successful. Your account is under verification.',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      id: user._id,
      fullName: user.fullName,
      mobile: user.mobile,
      address: user.address,
      kyc: user.kyc,
      status: user.status,
      rejectionReason: user.rejectionReason,
      referralCode: user.referralCode,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, address } = req.body;
    const user = await User.findById(req.user._id);

    if (fullName) user.fullName = fullName;
    if (address) user.address = { ...user.address, ...address };

    await user.save();

    res.json({
      id: user._id,
      fullName: user.fullName,
      mobile: user.mobile,
      address: user.address,
      status: user.status,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both passwords are required' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.upload = upload;
