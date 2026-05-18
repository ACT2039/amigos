import User from '../models/User.js';
import Location from '../models/Location.js';
import Group from '../models/Group.js';

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.username) user.username = req.body.username;
    if (req.body.profilePhoto) user.profilePhoto = req.body.profilePhoto;
    
    // Allow adding/updating phone number with +91 validation
    if (req.body.phoneNumber) {
      let phone = req.body.phoneNumber.trim();
      // Normalize: strip spaces, dashes
      phone = phone.replace(/[\s\-]/g, '');
      // Accept +91XXXXXXXXXX or 91XXXXXXXXXX or XXXXXXXXXX
      if (phone.startsWith('+91')) phone = phone;
      else if (phone.startsWith('91') && phone.length === 12) phone = '+' + phone;
      else if (/^\d{10}$/.test(phone)) phone = '+91' + phone;
      else return res.status(400).json({ message: 'Invalid Indian phone number. Must be 10 digits with +91.' });

      // Validate it's exactly +91 followed by 10 digits starting with 6-9
      if (!/^\+91[6-9]\d{9}$/.test(phone)) {
        return res.status(400).json({ message: 'Invalid Indian mobile number. Must start with 6-9 and be 10 digits.' });
      }

      // Check uniqueness
      const existing = await User.findOne({ phoneNumber: phone, _id: { $ne: req.user._id } });
      if (existing) return res.status(400).json({ message: 'This phone number is already registered.' });

      user.phoneNumber = phone;
    }

    const updatedUser = await user.save({ validateBeforeSave: false });

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      profilePhoto: updatedUser.profilePhoto,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get full profile with completion %
// @route   GET /api/users/me
// @access  Private
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-passwordHash -otp -otpExpires -resetPasswordToken -resetPasswordExpire');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const groupCount = await Group.countDocuments({ members: req.user._id });

    // Calculate profile completion
    let completed = 0;
    const total = 6;
    if (user.username && !user.username.startsWith('user_')) completed++;
    if (user.email && !user.email.startsWith('temp_')) completed++;
    if (user.phoneNumber) completed++;
    if (user.profilePhoto && user.profilePhoto !== 'https://api.dicebear.com/7.x/avataaars/svg?seed=default') completed++;
    if (groupCount > 0) completed++;
    if (user.currentLocation?.lat) completed++;

    const completionPercent = Math.round((completed / total) * 100);

    const missing = [];
    if (!user.phoneNumber) missing.push('Add your phone number');
    if (user.profilePhoto === 'https://api.dicebear.com/7.x/avataaars/svg?seed=default') missing.push('Upload a profile photo');
    if (groupCount === 0) missing.push('Join or create a group');
    if (!user.currentLocation?.lat) missing.push('Enable location tracking');

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      profilePhoto: user.profilePhoto,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      groupCount,
      completionPercent,
      missing,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update live location via REST (Fallback for Socket)
// @route   PUT /api/users/location
// @access  Private
export const updateLocation = async (req, res) => {
  try {
    const { lat, lng, address } = req.body;

    let location = await Location.findOne({ userId: req.user._id });

    if (location) {
      location.latitude = lat;
      location.longitude = lng;
      location.address = address || location.address;
      await location.save();
    } else {
      location = await Location.create({
        userId: req.user._id,
        latitude: lat,
        longitude: lng,
        address
      });
    }

    await User.findByIdAndUpdate(req.user._id, {
      currentLocation: { lat, lng, address, updatedAt: new Date() },
      lastSeen: new Date(),
      isOnline: true
    });

    res.json(location);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users (excluding current user)
// @route   GET /api/users
// @access  Private
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('username profilePhoto currentLocation isOnline lastSeen');
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-passwordHash -otp -otpExpires -resetPasswordToken -resetPasswordExpire');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get friend locations for a group
// @route   GET /api/users/group/:groupId/locations
// @access  Private
export const getGroupLocations = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const user = await User.findById(req.user._id);
    if (!user.groups.includes(groupId)) {
      return res.status(403).json({ message: 'Not authorized to view this group' });
    }

    const usersInGroup = await User.find({ groups: groupId })
      .select('username profilePhoto currentLocation lastSeen isOnline');
      
    res.json(usersInGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
