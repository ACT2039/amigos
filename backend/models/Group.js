import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 30
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  inviteTokens: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invitation'
  }],
  uniqueCode: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    index: true
  }
}, { timestamps: true });

const Group = mongoose.model('Group', groupSchema);
export default Group;
