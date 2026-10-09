const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trippilot', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected to host: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB] Warning: Could not connect to MongoDB instance. (${error.message})`);
    console.warn('[MongoDB] Server will continue in fallback mode for UI foundation testing.');
  }
};

module.exports = connectDB;
