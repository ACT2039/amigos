import mongoose from 'mongoose';

let isConnected = false;
let reconnectTimeout = null;

const connectDB = async () => {
  if (isConnected) {
    console.log('✅ Using existing MongoDB connection');
    return;
  }

  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error(
        'MONGO_URI is not defined. Please set it in your environment variables.'
      );
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 20,
      minPoolSize: 10,
      family: 4
    });

    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
      isConnected = false;
      scheduleReconnect();
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err.message);
      isConnected = false;
    });
    
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    isConnected = false;
    scheduleReconnect();
  }
};

const scheduleReconnect = () => {
  if (reconnectTimeout) return;
  console.log('🔄 Scheduling MongoDB reconnection in 5 seconds...');
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    connectDB().catch(err => console.error('Reconnect failed:', err));
  }, 5000);
};

export default connectDB;
