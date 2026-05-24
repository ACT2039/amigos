import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../services/emailService.js';
import sendSMS from '../services/smsService.js';
import crypto from 'crypto';

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const registerUser = async (req, res) => {
  const { username, email, password, phoneNumber } = req.body;

  if (!username || !email || !password || !phoneNumber) {
    return res.status(400).json({ message: 'All fields (username, email, phone, password) are required' });
  }

  // Normalize phone number
  const cleanPhone = phoneNumber.replace(/[\s\-]/g, '');

  try {
    const userExists = await User.findOne({ $or: [{ email }, { username }, { phoneNumber: cleanPhone }] });

    if (userExists) {
      if (userExists.email === email) return res.status(400).json({ message: 'Email is already registered' });
      if (userExists.username === username) return res.status(400).json({ message: 'Username is already taken' });
      return res.status(400).json({ message: 'Phone number is already registered' });
    }

    const user = await User.create({
      username,
      email,
      phoneNumber: cleanPhone,
      passwordHash: password,
    });

    if (user) {
      const token = generateToken(res, user._id);
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePhoto: user.profilePhoto,
        token,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Identifier and password are required' });
  }

  try {
    const cleanIdentifier = identifier.replace(/[\s\-]/g, '');
    const isPhone = /^(\+?\d+)$/.test(cleanIdentifier);
    
    const searchConditions = [
      { email: identifier },
      { username: identifier }
    ];

    if (isPhone) {
      searchConditions.push({ phoneNumber: cleanIdentifier });
      if (!cleanIdentifier.startsWith('+91') && cleanIdentifier.length >= 10) {
        searchConditions.push({ phoneNumber: '+91' + cleanIdentifier });
      }
    } else {
      searchConditions.push({ phoneNumber: identifier });
    }

    const user = await User.findOne({ $or: searchConditions }).select('+passwordHash');

    if (!user) {
      console.warn(`❌ Login failed: User not found for identifier: ${identifier}`);
      return res.status(404).json({ message: 'User not found. Please sign up first.', code: 'USER_NOT_FOUND' });
    }

    if (await user.matchPassword(password)) {
      const token = generateToken(res, user._id);
      console.log(`✅ Login successful for user: ${user.username}`);
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePhoto: user.profilePhoto,
        token,
      });
    } else {
      console.warn(`❌ Login failed: Invalid password for identifier: ${identifier}`);
      res.status(401).json({ message: 'Invalid password' });
    }
  } catch (error) {
    console.error(`🔥 Login error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send OTP for phone login
// @route   POST /api/auth/send-otp
// @access  Public
export const sendOtp = async (req, res) => {
  const { phoneNumber } = req.body;
  try {
    if (!phoneNumber) return res.status(400).json({ message: 'Phone number is required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    let user = await User.findOne({ phoneNumber });
    if (!user) {
      user = await User.create({
        username: `user_${Math.floor(Math.random() * 100000)}`,
        email: `temp_${Math.floor(Math.random() * 100000)}@amigo.app`,
        phoneNumber,
        passwordHash: otp,
        otp,
        otpExpires,
      });
    } else {
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save({ validateBeforeSave: false });
    }

    const message = `Your Amigos verification code is: ${otp}`;
    const result = await sendSMS(phoneNumber, message);

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP & login/signup
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res) => {
  const { phoneNumber, otp } = req.body;
  try {
    const user = await User.findOne({ phoneNumber });

    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    const token = generateToken(res, user._id);
    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePhoto: user.profilePhoto,
      token,
      isNewUser: user.email.startsWith('temp_'),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot Password — send OTP (SMS) or reset link (email)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  const { identifier, method } = req.body;

  if (!identifier || !method) {
    return res.status(400).json({ message: 'Identifier and method are required' });
  }

  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { phoneNumber: identifier }, { username: identifier }],
    });

    if (!user) {
      // Return generic message to avoid leaking user existence
      return res.status(200).json({ message: 'If an account with that identifier exists, a reset message was sent.' });
    }

    if (method === 'email') {
      // Generate a secure URL token (not used as OTP)
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
      await user.save({ validateBeforeSave: false });

      // The frontend handles the reset at /#/reset-password/:token (hash routing)
      const frontendUrl = (process.env.FRONTEND_URL || 'https://amigos-phi-sooty.vercel.app').replace(/\/+$/, '');
      const resetUrl = `${frontendUrl}/?resetToken=${resetToken}`;
      const message = `Hello ${user.username},\n\nYou requested a password reset for your Amigos account.\n\nClick the link below to set a new password (valid for 15 minutes):\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`;

      try {
        const result = await sendEmail({ email: user.email, subject: 'Amigos — Password Reset Request', message });

        res.status(200).json({ message: 'Password reset email sent successfully.' });
      } catch (emailErr) {
        // Roll back token if email fails, so user can try again
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return res.status(500).json({ message: emailErr.message });
      }

    } else if (method === 'sms') {
      if (!user.phoneNumber) {
        return res.status(400).json({ message: 'No phone number linked to this account.' });
      }

      // 6-digit numeric OTP stored as hash
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.resetPasswordToken = crypto.createHash('sha256').update(otp).digest('hex');
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save({ validateBeforeSave: false });

      const smsMessage = `Your Amigos password reset code is: ${otp}. Valid for 10 minutes. Do not share it.`;

      try {
        const result = await sendSMS(user.phoneNumber, smsMessage);

        res.status(200).json({ message: 'OTP sent to your registered phone number.' });
      } catch (smsErr) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return res.status(500).json({ message: smsErr.message });
      }

    } else {
      return res.status(400).json({ message: 'Invalid method. Use "email" or "sms".' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify reset OTP/token without actually resetting (used before showing new password form)
// @route   POST /api/auth/verify-reset-token
// @access  Public
export const verifyResetToken = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'Token is required' });

  try {
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired code. Please request a new one.' });
    }

    res.status(200).json({ message: 'Token is valid', username: user.username });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset Password using a verified token/OTP
// @route   PUT /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+passwordHash');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset code. Please request a new one.' });
    }

    // Set new password (pre-save hook will hash it)
    user.passwordHash = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    // Use save() which triggers the pre-save hook to hash the password
    await user.save();

    console.log(`✅ Password reset successful for user: ${user.username}`);
    res.status(200).json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error(`🔥 Password reset error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profilePhoto: user.profilePhoto,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};
