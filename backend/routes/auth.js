const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { validateRegister, validateLogin, validateForgotPassword, validateResetPassword } = require('../middleware/validate');
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User.model');

router.get('/check-username', authController.checkUsername);
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/logout', verifyToken, authController.logout);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
router.post('/reset-password/:token', validateResetPassword, authController.resetPassword);
router.get('/me', verifyToken, authController.getMe);

// ── E2E Encryption Key Management ──────────────────────
router.post('/upload-key', verifyToken, async (req, res) => {
  try {
    const { publicKey, fingerprint } = req.body;
    if (!publicKey || !fingerprint) {
      return res.status(400).json({ success: false, message: 'publicKey and fingerprint required' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      publicKey,
      fingerprint,
      keyUploadedAt: new Date(),
    });

    res.json({ success: true, message: 'Public key uploaded successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:userId/public-key', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('publicKey fingerprint');
    if (!user || !user.publicKey) {
      return res.status(404).json({ success: false, message: 'No public key found' });
    }
    res.json({ success: true, publicKey: user.publicKey, fingerprint: user.fingerprint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
