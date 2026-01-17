import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";

export const isLoggedIn = asyncHandler(async (req, res, next) => {
  let accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    const auth = req.headers.authorization || "";
    if (auth.startsWith("Bearer ")) {
      accessToken = auth.slice(7);
    }
  }

  if (!accessToken) {
    throw new ApiError(401, "Unauthorized");
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded;
    next();
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }
});

// Optional authentication middleware - sets req.user if valid token exists, but doesn't throw error if not
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    const auth = req.headers.authorization || "";
    if (auth.startsWith("Bearer ")) {
      accessToken = auth.slice(7);
    }
  }

  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      req.user = decoded;
    } catch (error) {
      // Silently ignore invalid tokens for optional auth
      console.warn('Optional auth: Invalid token provided, proceeding as guest');
    }
  }

  next();
});
