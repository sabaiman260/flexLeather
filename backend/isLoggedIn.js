import jwt from "jsonwebtoken";
import { User } from "../../modules/user/user.model.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * A utility function to generate new access and refresh tokens.
 * This assumes the User model has methods to generate these tokens.
 * It also persists the new refresh token in the database.
 */
const refreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Store the new refresh token, overwriting the old one
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while refreshing tokens.");
    }
};

export const isLoggedIn = asyncHandler(async (req, res, next) => {
    try {
        const incomingAccessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!incomingAccessToken) {
            throw new ApiError(401, "Unauthorized request: No access token provided.");
        }

        // Verify the access token
        const decodedToken = jwt.verify(incomingAccessToken, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid Access Token.");
        }

        req.user = user;
        return next();

    } catch (error) {
        // If access token verification fails (e.g., expired), try to use the refresh token.
        if (error instanceof jwt.TokenExpiredError || error.name === 'JsonWebTokenError') {
            const incomingRefreshToken = req.cookies?.refreshToken;

            if (!incomingRefreshToken) {
                throw new ApiError(401, "Access token expired and no refresh token found. Please log in again.");
            }

            try {
                const decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
                const user = await User.findById(decodedRefreshToken?._id);

                if (!user || user.refreshToken !== incomingRefreshToken) {
                    throw new ApiError(401, "Invalid or expired refresh token. Please log in again.");
                }

                // Tokens are valid, let's generate new ones
                const { accessToken, refreshToken: newRefreshToken } = await refreshTokens(user._id);

                const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production' };
                res.cookie("accessToken", accessToken, options).cookie("refreshToken", newRefreshToken, options);

                req.user = await User.findById(user._id).select("-password -refreshToken");
                return next();

            } catch (refreshError) {
                throw new ApiError(401, refreshError.message || "Invalid refresh token. Please log in again.");
            }
        }
        throw error;
    }
});