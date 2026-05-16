import mongoose from "mongoose";

let connectionPromise;

export function isDatabaseConfigured() {
  return Boolean(process.env.MONGO_URI?.trim());
}

export async function connectDatabase() {
  if (!isDatabaseConfigured()) {
    console.warn("MONGO_URI is not set. Lead APIs will accept valid requests without MongoDB storage.");
    return null;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000
    }).catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }

  return connectionPromise;
}

export function databaseState() {
  return mongoose.connection.readyState;
}

export function databaseErrorMessage(error) {
  const message = error instanceof Error ? error.message : "";

  if (/bad auth|authentication failed|auth failed/i.test(message)) {
    return "MongoDB authentication failed. Check the Atlas username/password and URL encoding.";
  }

  if (/querysrv|ENOTFOUND|ETIMEOUT|ECONNREFUSED|server selection/i.test(message)) {
    return "MongoDB connection failed. Check MONGO_URI, Atlas IP access list, and network access.";
  }

  return "We could not save your request because MongoDB is unavailable. Please try again shortly.";
}
