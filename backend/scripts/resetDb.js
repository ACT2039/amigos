import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const resetData = async () => {
  try {
    let uri = process.env.MONGO_URI;
    
    // If testing using the fake URI, this script won't work perfectly unless we spin up memory server again, 
    // but the memory server resets on exit anyway. This is mainly for real Atlas DBs.
    if (!uri || uri.includes('test:test@cluster0.mongodb.net')) {
      console.log('Using in-memory DB or placeholder URI. In-memory DB resets automatically on server restart.');
      process.exit(0);
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    console.log('Dropping databases...');
    await conn.connection.db.dropDatabase();
    
    console.log('Database Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

resetData();
