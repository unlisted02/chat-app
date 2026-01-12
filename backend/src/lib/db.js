import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    // Ensure we use 127.0.0.1 instead of localhost to avoid IPv6 resolution issues on Windows
    let mongoUri = process.env.MONGODB_URI;
    if (mongoUri.includes("localhost")) {
      mongoUri = mongoUri.replace("localhost", "127.0.0.1");
    }
    
    // Use directConnection option to avoid replica set issues and force direct connection
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      directConnection: true, // Force direct connection (not replica set)
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("MongoDB connection error:", error.message);
    console.log(`Attempting to connect to: ${process.env.MONGODB_URI}`);
    console.log("Retrying connection in 5 seconds...");
    setTimeout(() => connectDB(), 5000);
  }
};
