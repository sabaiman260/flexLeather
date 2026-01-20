import { asyncHandler } from "../../core/utils/async-handler.js";
import crypto from "crypto";
import User from "../../models/user.model.js";
import { ApiError } from "../../core/utils/api-error.js";
import { ApiResponse } from "../../core/utils/api-response.js";
import { userForgotPasswordMailBody, userVerificationMailBody } from "../../shared/constants/mail.constant.js";
import { mailTransporter } from "../../shared/helpers/mail.helper.js";
import { storeLoginCookies, storeAccessToken } from "../../shared/helpers/cookies.helper.js";
import S3UploadHelper from "../../shared/helpers/s3Upload.js";


//-------------------- REGISTER USER --------------------//
const registerUser = asyncHandler(async (req, res) => {
    const {
        userName,
        userEmail,
        userPassword,
        userRole,
        phoneNumber,
        userAddress
    } = req.body;

    // 0️⃣ Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9]{10,15}$/;

    if (!emailRegex.test(userEmail)) {
        throw new ApiError(400, "Invalid email format");
    }

    if (phoneNumber && !phoneRegex.test(phoneNumber)) {
        throw new ApiError(400, "Invalid phone number format (10-15 digits allowed)");
    }

    // 1️⃣ Check existing user
    const existingUser = await User.findOne({ userEmail: userEmail.toLowerCase() });
    if (existingUser) {
        // If user exists and is verified, return conflict
        if (existingUser.userIsVerified) {
            return res.status(409).json(
                new ApiResponse(409, {
                    code: "USER_ALREADY_EXISTS",
                    message: "An account with this email already exists and is verified."
                }, "User already exists")
            );
        }

        // If user exists but is not verified, resend verification email
        const { hashedToken, tokenExpiry } = existingUser.generateTemporaryToken();
        existingUser.userVerificationToken = hashedToken;
        existingUser.userVerificationTokenExpiry = tokenExpiry;
        await existingUser.save();

        const base = process.env.BASE_URL || "http://localhost:3000";
        const verificationLink = `${base}/api/v1/auth/verify/${hashedToken}`;

        // Send verification email (DO NOT fail if email fails)
        try {
            await mailTransporter.sendMail({
                from: process.env.BREVO_VERIFIED_EMAIL || 'patina@theflexleather.com',
                to: userEmail,
                subject: "Verify your email - FlexLeather",
                html: userVerificationMailBody(existingUser.userName, verificationLink)
            });
        } catch (error) {
            console.error("Email sending failed:", error.message);
        }

        return res.status(200).json(
            new ApiResponse(200, {
                code: "VERIFICATION_RESENT",
                userId: existingUser._id,
                userEmail: existingUser.userEmail
            }, "Verification email has been resent. Please check your email.")
        );
    }

    let profileImageKey = null;
    let profileSignedUrl = null;

    // 2️⃣ Upload profile image (optional)
    try {
        // Support single-file (`req.file`) and multiple files (`req.files` or object of arrays)
        let filesToUpload = [];
        if (Array.isArray(req.files) && req.files.length > 0) {
            filesToUpload = req.files;
        } else if (req.files && typeof req.files === 'object') {
            // could be object of arrays or single-key
            filesToUpload = Object.values(req.files).flat();
        } else if (req.file) {
            filesToUpload = [req.file];
        }

        if (filesToUpload.length > 0) {
            // If multiple files passed, reuse uploadMultipleFiles; otherwise upload single file
            if (filesToUpload.length === 1) {
                const uploadResult = await S3UploadHelper.uploadFile(filesToUpload[0], "user-profile");
                if (uploadResult?.key) {
                    profileImageKey = uploadResult.key;
                    try {
                        profileSignedUrl = await S3UploadHelper.getSignedUrl(uploadResult.key);
                    } catch (err) {
                        console.error('[auth:register] failed to generate signed URL for profile image', err?.message || err);
                    }
                }
            } else {
                try {
                    const uploads = await S3UploadHelper.uploadMultipleFiles(filesToUpload, 'user-profile');
                    if (Array.isArray(uploads) && uploads.length > 0) {
                        // take first as profile image
                        profileImageKey = uploads[0]?.key || null;
                        try {
                            profileSignedUrl = profileImageKey ? await S3UploadHelper.getSignedUrl(profileImageKey) : null;
                        } catch (err) {
                            console.error('[auth:register] failed to generate signed URL for profile image', err?.message || err);
                        }
                    }
                } catch (err) {
                    // Let fallthrough handle logging
                    throw err;
                }
            }
        }
    } catch (error) {
        // Do NOT fail registration due to profile image issues.
        // Log detailed error so we don't silently swallow real upload problems.
        console.error('[auth:register] profile image upload failed:', {
            message: error?.message,
            name: error?.name,
            stack: error?.stack,
            fileKeys: req.file ? [req.file?.originalname] : (req.files ? (Array.isArray(req.files) ? req.files.map(f=>f.originalname) : Object.values(req.files).flat().map(f=>f.originalname)) : []),
        });
        // keep profileImageKey null and continue registration
        profileImageKey = null;
        profileSignedUrl = null;
    }

    // 3️⃣ Create user (NOT verified)
    const user = await User.create({
        userName,
        userEmail,
        userPassword,
        userRole: userRole || "buyer",
        phoneNumber,
        userAddress,
        userIsVerified: false,
        ...(profileImageKey && { profileImage: profileImageKey })
    });

    if (!user) {
        throw new ApiError(400, "User creation failed");
    }

    // 4️⃣ Generate verification token
    const { hashedToken, tokenExpiry } = user.generateTemporaryToken();

    user.userVerificationToken = hashedToken;
    user.userVerificationTokenExpiry = tokenExpiry;
    await user.save();

    const base = process.env.BASE_URL || "http://localhost:3000";
    const verificationLink = `${base}/api/v1/auth/verify/${hashedToken}`;

    // 5️⃣ Send verification email (DO NOT fail registration)
    try {
        await mailTransporter.sendMail({
            from: process.env.BREVO_VERIFIED_EMAIL || 'patina@theflexleather.com',
            to: userEmail,
            subject: "Verify your email",
            html: userVerificationMailBody(userName, verificationLink)
        });
    } catch (error) {
        console.error("Email sending failed:", error.message);
    }

    // 6️⃣ Response
    return res.status(201).json(
        new ApiResponse(
            201,
            {
                userId: user._id,
                userName: user.userName,
                userEmail: user.userEmail,
                userRole: user.userRole,
                phoneNumber: user.phoneNumber,
                userAddress: user.userAddress,
                ...(profileSignedUrl && { profileImageUrl: profileSignedUrl })
            },
            "Registration successful. Please verify your email."
        )
    );
});

//-------------------- VERIFY EMAIL --------------------//
const verifyUserEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;

    const user = await User.findOne({
        userVerificationToken: token,
        userVerificationTokenExpiry: { $gt: Date.now() }
    });

    if (!user) throw new ApiError(400, "Invalid or expired verification token");

    user.userIsVerified = true;
    user.userVerificationToken = null;
    user.userVerificationTokenExpiry = null;

    await user.save();

    return res.status(200).json(new ApiResponse(200, {}, "Email verified successfully"));
});

//-------------------- LOGIN --------------------//
const loginUser = asyncHandler(async (req, res) => {
    const rawEmail = (req.body?.email || req.body?.userEmail || "").toString();
    const rawPassword = (req.body?.password || req.body?.userPassword || "").toString();

    const email = rawEmail.trim().toLowerCase();
    const password = rawPassword;

    console.log("[LOGIN] request body", { email, passwordReceived: !!password });

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const emailRegex = new RegExp("^" + email.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&") + "$", "i");
    const user = await User.findOne({ userEmail: emailRegex });
    console.log("[LOGIN] user found", !!user);
    if (!user) throw new ApiError(400, "User not found");

    const isPasswordCorrect = await user.isPasswordCorrect(password);
    console.log("[LOGIN] password match", isPasswordCorrect);
    if (!isPasswordCorrect) throw new ApiError(400, "Invalid password");

    if (!user.userIsVerified) throw new ApiError(400, "User not verified");

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    storeLoginCookies(res, accessToken, refreshToken);

    user.userRefreshToken = refreshToken;
    await user.save();

    let profileSignedUrl = null;
    if (user.profileImage) {
        try {
            profileSignedUrl = await S3UploadHelper.getSignedUrl(user.profileImage);
        } catch {}
    }

    const response = {
        user: {
            userId: user._id,
            userName: user.userName,
            userEmail: user.userEmail,
            userRole: user.userRole,
            phoneNumber: user.phoneNumber,
            userAddress: user.userAddress,
            profileImage: profileSignedUrl
        },
        tokens: { accessToken, refreshToken }
    };

    return res.status(200).json(new ApiResponse(200, response, "Login successful"));
});

//-------------------- LOGOUT --------------------//
const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) throw new ApiError(401, "Not authenticated");

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    user.userRefreshToken = null;
    await user.save();

    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: '/'
    };

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res.status(200).json(new ApiResponse(200, {}, "Logged out successfully"));
});

//-------------------- REFRESH ACCESS TOKEN --------------------//
const getAccessToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) throw new ApiError(400, "Refresh token missing");

    const user = await User.findOne({ userRefreshToken: refreshToken });
    if (!user) throw new ApiError(400, "Invalid refresh token");

    const newAccessToken = user.generateAccessToken();

    storeAccessToken(res, newAccessToken);

    return res.status(200).json(new ApiResponse(200, { accessToken: newAccessToken }, "New access token issued"));
});

//-------------------- FORGOT PASSWORD --------------------//
const forgotPasswordMail = asyncHandler(async (req, res) => {
    const { userEmail } = req.body;

    const user = await User.findOne({ userEmail });
    if (!user) throw new ApiError(400, "User not found");

    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();
    user.userPasswordResetToken = hashedToken;
    user.userPasswordExpirationDate = tokenExpiry;

    await user.save();

    // Link should point to the frontend reset page so user sees the form
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${unHashedToken}`;

    await mailTransporter.sendMail({
        from: process.env.BREVO_VERIFIED_EMAIL || 'patina@theflexleather.com',
        to: userEmail,
        subject: "Password Reset",
        html: userForgotPasswordMailBody(user.userName, resetLink),
    });

    return res.status(200).json(new ApiResponse(200, { resetLink }, "Password reset link sent"));
});

//-------------------- RESET PASSWORD --------------------//
const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { userPassword } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        userPasswordResetToken: hashedToken,
        userPasswordExpirationDate: { $gt: Date.now() }
    });

    if (!user) throw new ApiError(400, "Invalid or expired reset token");

    user.userPassword = userPassword;
    user.userPasswordResetToken = null;
    user.userPasswordExpirationDate = null;

    await user.save();

    return res.status(200).json(new ApiResponse(200, {}, "Password reset successfully"));
});

export {
    registerUser,
    verifyUserEmail,
    loginUser,
    logoutUser,
    getAccessToken,
    forgotPasswordMail,
    resetPassword
};

//-------------------- CURRENT USER --------------------//
export const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(404, "User not found");

    let profileSignedUrl = null;
    if (user.profileImage) {
        try {
            profileSignedUrl = await S3UploadHelper.getSignedUrl(user.profileImage);
        } catch {}
    }

    return res.status(200).json(new ApiResponse(200, {
        user: {
            userId: user._id,
            userName: user.userName,
            userEmail: user.userEmail,
            userRole: user.userRole,
            phoneNumber: user.phoneNumber,
            userAddress: user.userAddress,
            userIsVerified: user.userIsVerified,
            profileImage: profileSignedUrl
        }
    }, "OK"));
});

//-------------------- UPDATE CURRENT USER --------------------//
export const updateMe = asyncHandler(async (req, res) => {
    const { userName, userEmail, phoneNumber, userAddress } = req.body || {};
    const updates = {};
    if (typeof userName === "string") updates.userName = userName;
    if (typeof userEmail === "string") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userEmail)) throw new ApiError(400, "Invalid email format");
        // Ensure uniqueness if email changes
        const existing = await User.findOne({ userEmail: userEmail.toLowerCase(), _id: { $ne: req.user._id } });
        if (existing) throw new ApiError(400, "Email already in use");
        updates.userEmail = userEmail.toLowerCase();
    }
    if (typeof phoneNumber === "string") {
        const phoneRegex = /^\+?[0-9]{10,15}$/;
        if (!phoneRegex.test(phoneNumber)) throw new ApiError(400, "Invalid phone number format (10-15 digits allowed)");
        updates.phoneNumber = phoneNumber;
    }
    if (typeof userAddress === "string") updates.userAddress = userAddress;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    if (!user) throw new ApiError(404, "User not found");

    let profileSignedUrl = null;
    if (user.profileImage) {
        try {
            profileSignedUrl = await S3UploadHelper.getSignedUrl(user.profileImage);
        } catch {}
    }

    return res.status(200).json(new ApiResponse(200, {
        user: {
            userId: user._id,
            userName: user.userName,
            userEmail: user.userEmail,
            userRole: user.userRole,
            phoneNumber: user.phoneNumber,
            userAddress: user.userAddress,
            userIsVerified: user.userIsVerified,
            profileImage: profileSignedUrl
        }
    }, "Profile updated"));
});

export const getGoogleClientId = asyncHandler(async (_req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID || null;
    return res.status(200).json(new ApiResponse(200, { clientId }, "OK"));
});

//-------------------- GOOGLE LOGIN --------------------//
export const googleLogin = asyncHandler(async (req, res) => {
    const { idToken } = req.body || {};
    if (!idToken) throw new ApiError(400, "Google ID token is required");

    // Verify ID token via Google tokeninfo endpoint
    const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    let tokenInfo;
    try {
        const resp = await fetch(verifyUrl);
        if (!resp.ok) {
            throw new ApiError(400, "Invalid Google token");
        }
        tokenInfo = await resp.json();
    } catch {
        throw new ApiError(400, "Failed to verify Google token");
    }

    const aud = tokenInfo.aud;
    const email = tokenInfo.email;
    const emailVerified = tokenInfo.email_verified === "true" || tokenInfo.email_verified === true;
    const name = tokenInfo.name || email?.split("@")[0] || "Google User";

    if (!email || !emailVerified) {
        throw new ApiError(400, "Google account email not verified");
    }

    // Optional audience check
    const expectedClientId = process.env.GOOGLE_CLIENT_ID;
    if (expectedClientId && aud !== expectedClientId) {
        throw new ApiError(400, "Google client mismatch");
    }

    let user = await User.findOne({ userEmail: email.toLowerCase() });

    // Create user if not exists (use random password to satisfy schema)
    if (!user) {
        const randomPassword = crypto.randomBytes(16).toString("hex");
        user = await User.create({
            userName: name,
            userEmail: email.toLowerCase(),
            userPassword: randomPassword,
            userRole: "buyer",
            userIsVerified: true
        });
    } else if (!user.userIsVerified) {
        user.userIsVerified = true;
        await user.save();
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    storeLoginCookies(res, accessToken, refreshToken);

    user.userRefreshToken = refreshToken;
    await user.save();

    let profileSignedUrl = null;
    if (user.profileImage) {
        try {
            profileSignedUrl = await S3UploadHelper.getSignedUrl(user.profileImage);
        } catch {}
    }

    const response = {
        user: {
            userId: user._id,
            userName: user.userName,
            userEmail: user.userEmail,
            userRole: user.userRole,
            phoneNumber: user.phoneNumber,
            userAddress: user.userAddress,
            profileImage: profileSignedUrl
        },
        tokens: { accessToken, refreshToken }
    };

    return res.status(200).json(new ApiResponse(200, response, "Login successful"));
});
