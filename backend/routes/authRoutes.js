import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  sendOtp,
  verifyOtp,
  forgotPassword,
  verifyResetToken,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-token', verifyResetToken);
router.put('/reset-password/:token', resetPassword);

router.get('/profile', protect, getUserProfile);

export default router;
