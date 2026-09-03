const express = require('express');
const router = express.Router();
const { login, register, getProfile, updateProfile, changePassword, upload } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const handleUpload = (req, res, next) => {
  upload.fields([
    { name: 'aadhaarFront', maxCount: 1 },
    { name: 'aadhaarBack', maxCount: 1 },
    { name: 'panPhoto', maxCount: 1 },
    { name: 'paymentScreenshot', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'File upload failed' });
    }
    next();
  });
};

router.post('/login', login);

router.post('/register', handleUpload, register);

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.put('/change-password', auth, changePassword);

module.exports = router;
