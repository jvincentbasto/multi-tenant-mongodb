import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("Database URI not found.");
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectMongoose = async (name) => {
  try {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
      cached.promise = mongoose.connect(uri, {
        bufferCommands: false,
      });
    }

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    throw new Error("MongoDB connection error. " + (error?.message ?? ""));
  }
};

const disconnectMongoose = async () => {
  try {
    if (cached.conn) {
      await mongoose.connection.close();
      cached.conn = null;
    }
  } catch (error) {
    throw new Error("MongoDB disconnection error. " + (error?.message ?? ""));
  }
};

export const single = {
  connect: connectMongoose,
  disconnect: disconnectMongoose,
};
