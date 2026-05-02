import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../.env");

const dotenvResult = dotenv.config({ path: envPath, override: true });

const required = ["MONGO_URI", "JWT_SECRET"];

if (dotenvResult.error) {
  console.warn(`Could not load .env from ${envPath}: ${dotenvResult.error.message}`);
} else {
  console.log(`Loaded environment from ${envPath}`);
}

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
