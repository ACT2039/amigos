import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import setupSockets from './sockets/index.js';

// Load env vars
dotenv.config();

// Connect to database with retry logic
let dbConnected = false;
const connectDBWithRetry = async () => {
  const maxRetries = 5;
  for (let i = 0; i < maxRetries; i++) {
    try {
      await connectDB();
      dbConnected = true;
      return;
    } catch (error) {
      console.error(`DB connection attempt ${i + 1}/${maxRetries} failed:`, error.message);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }
  console.warn('⚠️ Could not connect to database, but server will continue running');
};

connectDBWithRetry();

const allowedOrigins = (process.env.FRONTEND_URL || process.env.VERCEL_URL || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  // Socket.IO reconnection settings
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
  pingInterval: 25000,
  pingTimeout: 60000,
  transports: ['websocket', 'polling']
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));ot endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Amigos Backend API',
    version: '1.0.0',
    status: 'online'
  });
});

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Amigos API is running',
    environment: process.env.NODE_ENV || 'development'
  });
});
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Amigos API is running',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
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

const PORT = process.env.PORT || 5000;

// Global error handlers to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Give server time to log and notify, then restart
  setTimeout(() => process.exit(1), 1000);
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`✅ Server is in ONLINE mode`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${dbConnected ? 'Connected' : 'Connecting...'}es
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Give server time to log and notify, then restart
  setTimeout(() => process.exit(1), 1000);
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`✅ Server is in ONLINE mode`);
});
