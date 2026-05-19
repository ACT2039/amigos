import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from '../backend/config/db.js';
import setupSockets from '../backend/sockets/index.js';

// Load env vars
dotenv.config();

// Connect to database with retry logic
let dbConnected = false;
const connectDBWithRetry = async () => {
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      await connectDB();
      dbConnected = true;
      console.log('✅ Database connected successfully');
      return;
    } catch (error) {
      console.error(`DB connection attempt ${i + 1}/${maxRetries} failed:`, error.message);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  console.warn('⚠️ Could not connect to database initially, but server will continue running');
};

// Initialize database connection
connectDBWithRetry().catch(err => {
  console.error('Final DB connection error:', err);
});

const allowedOrigins = (process.env.FRONTEND_URL || process.env.VERCEL_URL || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet());

// Health check endpoints
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Amigos API is running',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

app.get('/api/status', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    database: dbConnected ? 'connected' : 'connecting',
    timestamp: new Date().toISOString()
  });
});

// Import Routes
import authRoutes from '../backend/routes/authRoutes.js';
import userRoutes from '../backend/routes/userRoutes.js';
import groupRoutes from '../backend/routes/groupRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Amigos Backend API',
    version: '1.0.0',
    status: 'online'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    status: err.status || 500
  });
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Export for Vercel serverless - use module.exports for CommonJS compatibility
export { app as default };
export const handler = app;
