import dotenv from "dotenv";

// Load .env only in development
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const required = ["MONGO_URI", "JWT_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const readEnv = (key) => process.env[key]?.trim();

export const env = {
  PORT: Number(readEnv("PORT") || 5000),
  NODE_ENV: readEnv("NODE_ENV") || "development",
  CLIENT_URL: readEnv("CLIENT_URL") || "http://localhost:5173",
  MONGO_URI: readEnv("MONGO_URI"),
  JWT_SECRET: readEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: readEnv("JWT_EXPIRES_IN") || "7d",
  GEMINI_API_KEY: readEnv("GEMINI_API_KEY"),
  GEMINI_MODEL: readEnv("GEMINI_MODEL") || "gemini-1.5-flash"
};

if (!env.MONGO_URI.startsWith("mongodb+srv://") && !env.MONGO_URI.startsWith("mongodb://")) {
  throw new Error("MONGO_URI must start with mongodb+srv:// or mongodb://");
}
