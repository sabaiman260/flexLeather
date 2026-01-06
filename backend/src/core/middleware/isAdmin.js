import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
const isAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized , please login");
  }
  const role = req.user.role || req.user.userRole;
  if (role !== "admin") {
    throw new ApiError(403, "Access denied , admin only");
  }
  next();
});
export { isAdmin };
