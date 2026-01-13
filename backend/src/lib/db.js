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
    
    // Check if it's a local connection (non-SRV) or Atlas (SRV)
    const isLocalConnection = !mongoUri.startsWith("mongodb+srv://");
    
    // Connection options
    const connectionOptions = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    };
    
    // Only use directConnection for local MongoDB (not for Atlas SRV URIs)
    if (isLocalConnection) {
      connectionOptions.directConnection = true;
    }
    
    const conn = await mongoose.connect(mongoUri, connectionOptions);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("MongoDB connection error:", error.message);
    console.log(`Attempting to connect to: ${process.env.MONGODB_URI}`);
    console.log("Retrying connection in 5 seconds...");
    setTimeout(() => connectDB(), 5000);
  }
};
