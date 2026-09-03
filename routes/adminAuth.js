const express = require('express');
const router = express.Router();
const { login, getProfile, getPendingUsers, getUserDetails, updateUserStatus } = require('../controllers/adminController');
const { auth, adminOnly } = require('../middleware/auth');

router.post('/login', login);

router.get('/users', auth, adminOnly, getPendingUsers);
router.get('/users/:id', auth, adminOnly, getUserDetails);
router.put('/users/:id/status', auth, adminOnly, updateUserStatus);

router.get('/profile', auth, adminOnly, getProfile);

module.exports = router;
