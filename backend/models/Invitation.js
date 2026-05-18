import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  usedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

// Auto-delete expired tokens (TTL index)
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Invitation = mongoose.model('Invitation', invitationSchema);
export default Invitation;
