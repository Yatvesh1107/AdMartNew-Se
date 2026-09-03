const express = require('express');
const router = express.Router();
const { getActiveQr, getAllQr, uploadQr, toggleQr, deleteQr, upload } = require('../controllers/qrController');
const { auth, adminOnly } = require('../middleware/auth');

const handleUpload = (req, res, next) => {
  upload.single('qrImage')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'File upload failed' });
    }
    next();
  });
};

// Public - active QR for registration
router.get('/active', getActiveQr);

// Admin only
router.get('/', auth, adminOnly, getAllQr);
router.post('/', auth, adminOnly, handleUpload, uploadQr);
router.put('/:id/toggle', auth, adminOnly, toggleQr);
router.delete('/:id', auth, adminOnly, deleteQr);

module.exports = router;
