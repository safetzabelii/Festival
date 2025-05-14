// Fallback MongoDB connection for JavaScript environments
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check for either MONGO_URI or MONGODB_URI environment variables
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.warn('MongoDB connection string not found in environment variables. This is okay for the fallback server.');
      return;
    }
    
    console.log('Connecting to MongoDB (fallback)...');
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.log('Continuing with limited functionality...');
  }
};

module.exports = connectDB; 