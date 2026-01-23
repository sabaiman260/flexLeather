const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
    profileImage: { type: String, default: "" },
    userName: { type: String, required: true, trim: true },
    userEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
    userPassword: { type: String, required: true, minlength: 6 },
    userAddress: { type: String, maxlength: 200 },
    phoneNumber: { type: String },
    userRole: { type: String, enum: ["buyer", "admin"], default: "buyer" },
    isActive: { type: Boolean, default: true },
    userIsVerified: { type: Boolean, default: false },
    userVerificationToken: { type: String, default: null },
    userVerificationTokenExpiry: { type: Date },
    userPasswordResetToken: { type: String },
    userPasswordExpirationDate: { type: Date },
    userRefreshToken: { type: String }
}, { timestamps: true });

// Hash password before saving
userSchema.pre("save", async function(next) {
    if (!this.isModified("userPassword")) return next();
    this.userPassword = await bcrypt.hash(this.userPassword, 10);
    next();
});

// Compare password
userSchema.methods.isPasswordCorrect = async function(plainPassword) {
    return await bcrypt.compare(plainPassword, this.userPassword);
};

// Generate access token
userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        { _id: this._id, userEmail: this.userEmail, userName: this.userName, role: this.userRole },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        { _id: this._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

// Generate temporary token (for verification / password reset)
userSchema.methods.generateTemporaryToken = function() {
    const unHashedToken = crypto.randomBytes(20).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(unHashedToken).digest("hex");
    const tokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    return { unHashedToken, hashedToken, tokenExpiry };
};

const User = mongoose.model("User", userSchema);
module.exports = User;
