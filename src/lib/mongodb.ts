import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// Connection cache
let cachedConnection: { 
  client: typeof mongoose | null; 
  promise: Promise<typeof mongoose> | null 
} = {
  client: null,
  promise: null
};

async function connectToDatabase(): Promise<typeof mongoose> {
  // If we already have a connection, return it
  if (cachedConnection.client) {
    return cachedConnection.client;
  }

  // Check if MongoDB URI is defined
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  // If a connection is being established, wait for it
  if (!cachedConnection.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout for server selection
      connectTimeoutMS: 10000, // 10 seconds timeout for initial connection
      socketTimeoutMS: 45000, // 45 seconds timeout for socket operations
    };

    // Create new connection promise
    cachedConnection.promise = mongoose.connect(MONGODB_URI as string, opts);
  }

  try {
    // Wait for the connection
    cachedConnection.client = await cachedConnection.promise;
    console.log('MongoDB connected successfully');
  } catch (e) {
    // On error, clear the connection promise so we can retry
    cachedConnection.promise = null;
    console.error('MongoDB connection error:', e);
    throw e;
  }

  // Handle connection events
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
    cachedConnection.client = null;
    cachedConnection.promise = null;
  });

  return cachedConnection.client;
}

export default connectToDatabase; 