import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// Define a proper interface for the global cache
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Add the mongoose property to the NodeJS global type
declare global {
  var mongoose: MongooseCache;
}

// Initialize the global cache if not already done
if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB with optimized connection pooling for serverless environments
 * @returns Mongoose instance
 */
async function connectToDatabase(): Promise<typeof mongoose> {
  // If we already have a connection and it's connected, return it
  if (global.mongoose.conn && mongoose.connection.readyState === 1) {
    console.log('Using existing MongoDB connection');
    return global.mongoose.conn;
  }

  // Check if MongoDB URI is defined
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  // If a connection is being established, wait for it
  if (global.mongoose.promise) {
    console.log('Waiting for existing MongoDB connection attempt to complete');
    try {
      const conn = await global.mongoose.promise;
      global.mongoose.conn = conn;
      return conn;
    } catch (error) {
      console.error('Previous MongoDB connection attempt failed, retrying:', error);
      global.mongoose.promise = null;
    }
  }

  // Set up configuration options optimized for serverless
  const opts = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,      // Reduced pool size for serverless
    minPoolSize: 1,
    maxIdleTimeMS: 30000, // Shorter idle time for serverless
    heartbeatFrequencyMS: 10000,
    retryWrites: true,
    family: 4,
    autoIndex: process.env.NODE_ENV !== 'production',
    autoCreate: process.env.NODE_ENV !== 'production',
  };

  console.log('Establishing new MongoDB connection...');
  
  // Create new connection promise
  global.mongoose.promise = mongoose.connect(MONGODB_URI, opts);
  
  try {
    // Wait for the connection
    const conn = await global.mongoose.promise;
    global.mongoose.conn = conn;
    console.log('MongoDB connected successfully');
    
    // Set up connection event handlers
    setupConnectionHandlers();
    
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    global.mongoose.promise = null;
    throw error;
  }
}

/**
 * Set up MongoDB connection event handlers
 */
function setupConnectionHandlers() {
  // Remove any existing listeners to prevent duplicates
  mongoose.connection.removeAllListeners('error');
  mongoose.connection.removeAllListeners('disconnected');
  mongoose.connection.removeAllListeners('reconnected');
  
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });
  
  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
  });
}

/**
 * Get current MongoDB connection status
 * @returns Connection status object
 */
export function getConnectionStatus() {
  return {
    status: global.mongoose.conn ? 'connected' : 'disconnected',
    readyState: mongoose.connection.readyState,
    connected: mongoose.connection.readyState === 1
  };
}

export default connectToDatabase; 