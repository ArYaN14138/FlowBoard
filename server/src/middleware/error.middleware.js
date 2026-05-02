import { ApiError } from "../utils/ApiError.js";

export const notFoundHandler = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const payload = {
    success: false,
    message: error.message || "Internal server error"
  };

  if (error.details) payload.details = error.details;
  if (process.env.NODE_ENV !== "production") payload.stack = error.stack;

  res.status(statusCode).json(payload);
};
