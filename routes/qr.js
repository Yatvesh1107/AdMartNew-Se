const express = require('express');
const router = express.Router();
const { getActiveQr, getAllQr, uploadQr, toggleQr, deleteQr, upload } = require('../controllers/qrController');
const { auth, adminOnly } = require('../middleware/auth');

// Public - active QR for registration
router.get('/active', getActiveQr);

// Admin only
router.get('/', auth, adminOnly, getAllQr);
router.post('/', auth, adminOnly, upload.single('qrImage'), uploadQr);
router.put('/:id/toggle', auth, adminOnly, toggleQr);
router.delete('/:id', auth, adminOnly, deleteQr);

module.exports = router;
