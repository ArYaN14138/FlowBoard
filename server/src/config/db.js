import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDB = async () => {
  mongoose.set("strictQuery", true);

  if (!env.MONGO_URI.startsWith("mongodb+srv://") && !env.MONGO_URI.startsWith("mongodb://")) {
    throw new Error("Invalid MONGO_URI. It must start with mongodb+srv:// or mongodb://");
  }

  console.log(`Connecting to ${env.MONGO_URI.includes(".mongodb.net") ? "MongoDB Atlas" : "MongoDB"}...`);

  const connection = await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    family: 4
  });

  console.log(`MongoDB connected: ${connection.connection.host}/${connection.connection.name}`);
};
