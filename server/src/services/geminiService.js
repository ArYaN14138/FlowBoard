import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

const getModel = () => {
  if (!env.GEMINI_API_KEY) return null;
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: env.GEMINI_MODEL });
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const stripJsonFence = (text) =>
  text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

export const parseJsonObject = (text) => {
  const stripped = stripJsonFence(text);
  const first = stripped.indexOf("{");
  const last = stripped.lastIndexOf("}");
  if (first === -1 || last === -1) {
    throw new ApiError(502, "AI response did not contain JSON");
  }
  return JSON.parse(stripped.slice(first, last + 1));
};

export const generateText = async (prompt, { retries = 2 } = {}) => {
  const model = getModel();
  if (!model) {
    throw new ApiError(503, "GEMINI_API_KEY is not configured");
  }

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(400 * (attempt + 1));
    }
  }

  throw new ApiError(502, "AI generation failed", lastError?.message);
};

export const generateJson = async (prompt, fallback) => {
  try {
    const text = await generateText(prompt);
    return parseJsonObject(text);
  } catch (error) {
    if (fallback) return fallback(error);
    throw error;
  }
};
