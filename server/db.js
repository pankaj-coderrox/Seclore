import mongoose from "mongoose";

let connectionPromise;

export function isDatabaseConfigured() {
  return Boolean(process.env.MONGO_URI);
}

export async function connectDatabase() {
  if (!isDatabaseConfigured()) {
    console.warn("MONGO_URI is not set. Lead APIs will return 503 until configured.");
    return null;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
  }

  return connectionPromise;
}

export function databaseState() {
  return mongoose.connection.readyState;
}
