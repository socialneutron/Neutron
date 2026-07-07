/**
 * config/db.js
 * MongoDB Atlas connection using Mongoose.
 * Implements connection pooling, retry logic, and graceful shutdown.
 */

const mongoose = require('mongoose');

// Suppress Mongoose deprecation warnings
mongoose.set('strictQuery', false);

/**
 * Connect to MongoDB Atlas.
 * Called once at server startup.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌  MONGODB_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      // Connection pool — keeps N sockets open to Atlas
      maxPoolSize: 10,
      minPoolSize: 2,
      // Timeouts
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      // Heartbeat
      heartbeatFrequencyMS: 10000,
    });

    console.log(`✅  MongoDB connected: ${conn.connection.host}`);

    // Log when the connection drops and Mongoose auto-reconnects
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️   MongoDB disconnected — attempting reconnect…');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅  MongoDB reconnected.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌  MongoDB connection error:', err.message);
    });

  } catch (err) {
    console.error('❌  Failed to connect to MongoDB:', err.message);
    // Exit so the process manager (PM2 / Railway) can restart it
    process.exit(1);
  }
};

/**
 * Gracefully close the Mongoose connection.
 * Called on SIGINT / SIGTERM so in-flight queries can finish.
 */
const closeDB = async () => {
  await mongoose.connection.close();
  console.log('🔌  MongoDB connection closed.');
};

module.exports = { connectDB, closeDB };
