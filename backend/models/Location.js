import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Ensure one active location document per user
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  address: {
    type: String
  }
}, { timestamps: true });

// Create index for geospatial queries if needed in the future
locationSchema.index({ latitude: 1, longitude: 1 });

const Location = mongoose.model('Location', locationSchema);
export default Location;
