import Group from '../models/Group.js';
import Invitation from '../models/Invitation.js';
import User from '../models/User.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Generate a unique group code like AMG-7K4P9X
function generateGroupCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars (0,O,1,I)
  let code = 'AMG-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
export const createGroup = async (req, res) => {
  try {
    const { groupName } = req.body;
    if (!groupName || !groupName.trim()) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    // Generate unique code, retry on collision
    let uniqueCode;
    let attempts = 0;
    do {
      uniqueCode = generateGroupCode();
      const exists = await Group.findOne({ uniqueCode });
      if (!exists) break;
      attempts++;
    } while (attempts < 10);
    
    const group = await Group.create({
      groupName: groupName.trim(),
      admin: req.user._id,
      members: [req.user._id],
      uniqueCode
    });

    await User.findByIdAndUpdate(req.user._id, {
      $push: { groups: group._id }
    });

    const populated = await Group.findById(group._id)
      .populate('admin', 'username profilePhoto')
      .populate('members', 'username profilePhoto isOnline lastSeen');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Rename a group (admin only)
// @route   PUT /api/groups/:id/rename
// @access  Private
export const renameGroup = async (req, res) => {
  try {
    const { groupName } = req.body;
    if (!groupName || !groupName.trim()) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the group admin can rename the group' });
    }

    group.groupName = groupName.trim();
    await group.save();

    res.json({ message: 'Group renamed', groupName: group.groupName });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Regenerate group unique code (admin only)
// @route   PUT /api/groups/:id/code
// @access  Private
export const regenerateGroupCode = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the group admin can regenerate the code' });
    }

    let uniqueCode;
    let attempts = 0;
    do {
      uniqueCode = generateGroupCode();
      const exists = await Group.findOne({ uniqueCode });
      if (!exists) break;
      attempts++;
    } while (attempts < 10);

    group.uniqueCode = uniqueCode;
    await group.save();

    res.json({ message: 'Group code regenerated', uniqueCode: group.uniqueCode });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Leave a group
// @route   POST /api/groups/:id/leave
// @access  Private
export const leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!group.members.map(m => m.toString()).includes(req.user._id.toString())) {
      return res.status(400).json({ message: 'You are not a member of this group' });
    }

    group.members = group.members.filter(m => m.toString() !== req.user._id.toString());
    
    if (group.admin.toString() === req.user._id.toString() && group.members.length > 0) {
      group.admin = group.members[0];
    }

    if (group.members.length === 0) {
      await Group.findByIdAndDelete(group._id);
    } else {
      await group.save();
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { groups: group._id }
    });

    res.json({ message: 'Left the group successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search user's groups by name
// @route   GET /api/groups/search?q=...
// @access  Private
export const searchGroups = async (req, res) => {
  try {
    const query = req.query.q || '';
    const groups = await Group.find({
      members: req.user._id,
      groupName: { $regex: query, $options: 'i' }
    })
    .populate('admin', 'username profilePhoto')
    .populate('members', 'username profilePhoto isOnline lastSeen');
    
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate Invite Link
// @route   POST /api/groups/:id/invite
// @access  Private
export const generateInviteToken = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!group.members.map(m => m.toString()).includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await Invitation.create({
      token,
      groupId: group._id,
      createdBy: req.user._id,
      expiresAt
    });

    group.inviteTokens.push(invitation._id);
    await group.save();

    const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const inviteLink = `${baseUrl}/invite/${token}`;

    res.json({ inviteLink, token, uniqueCode: group.uniqueCode });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Invite Details (public)
// @route   GET /api/groups/invite/:token
// @access  Public
export const getInviteDetails = async (req, res) => {
  try {
    const { token } = req.params;
    
    const invitation = await Invitation.findOne({ token })
      .populate('groupId', 'groupName')
      .populate('createdBy', 'username profilePhoto');
      
    if (!invitation) return res.status(404).json({ message: 'Invalid or expired invite link' });

    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({ message: 'This invite link has expired' });
    }

    res.json({
      groupName: invitation.groupId.groupName,
      createdBy: invitation.createdBy.username,
      creatorPhoto: invitation.createdBy.profilePhoto,
      expiresAt: invitation.expiresAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Join Group via Invite Link
// @route   POST /api/groups/join/:token
// @access  Private
export const joinGroup = async (req, res) => {
  try {
    const { token } = req.params;
    
    const invitation = await Invitation.findOne({ token }).populate('groupId');
    if (!invitation) return res.status(404).json({ message: 'Invalid or expired invite link' });

    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({ message: 'This invite link has expired' });
    }

    const group = await Group.findById(invitation.groupId);
    
    if (group.members.map(m => m.toString()).includes(req.user._id.toString())) {
      const populated = await Group.findById(group._id)
        .populate('members', 'username profilePhoto isOnline lastSeen');
      return res.json({ message: 'You are already a member of this group', group: populated });
    }

    group.members.push(req.user._id);
    await group.save();

    await User.findByIdAndUpdate(req.user._id, {
      $push: { groups: group._id }
    });

    invitation.usedBy.push(req.user._id);
    await invitation.save();
    
    const populated = await Group.findById(group._id)
      .populate('members', 'username profilePhoto isOnline lastSeen');

    res.json({ message: 'Successfully joined the group', group: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Join Group via Unique Code
// @route   POST /api/groups/join-code
// @access  Private
export const joinGroupByCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ message: 'Group code is required' });
    }

    const group = await Group.findOne({ uniqueCode: code.trim().toUpperCase() });
    if (!group) {
      return res.status(404).json({ message: 'Invalid group code. Please check and try again.' });
    }

    if (group.members.map(m => m.toString()).includes(req.user._id.toString())) {
      const populated = await Group.findById(group._id)
        .populate('admin', 'username profilePhoto')
        .populate('members', 'username profilePhoto isOnline lastSeen');
      return res.json({ message: 'You are already a member of this group', group: populated });
    }

    group.members.push(req.user._id);
    await group.save();

    await User.findByIdAndUpdate(req.user._id, {
      $push: { groups: group._id }
    });

    const populated = await Group.findById(group._id)
      .populate('admin', 'username profilePhoto')
      .populate('members', 'username profilePhoto isOnline lastSeen');

    res.json({ message: 'Successfully joined the group', group: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get User's Groups
// @route   GET /api/groups
// @access  Private
export const getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('admin', 'username profilePhoto')
      .populate('members', 'username profilePhoto isOnline lastSeen currentLocation');
    
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
