const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false, default: null },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" }, // Made optional for backward compatibility
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
    images: [{ type: String }],
    isApproved: { type: Boolean, default: false }, // admin approval
    isGuest: { type: Boolean, default: false },
    guestDetails: {
        fullName: { type: String },
        email: { type: String }
    },
}, { timestamps: true });

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
