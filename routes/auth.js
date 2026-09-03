const express = require('express');
const router = express.Router();
const { login, register, getProfile, updateProfile, changePassword, upload } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/login', login);

router.post('/register', upload.fields([
  { name: 'aadhaarFront', maxCount: 1 },
  { name: 'aadhaarBack', maxCount: 1 },
  { name: 'panPhoto', maxCount: 1 },
  { name: 'paymentScreenshot', maxCount: 1 },
]), register);

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.put('/change-password', auth, changePassword);

module.exports = router;
