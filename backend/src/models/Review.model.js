import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
    images: [{ type: String }],
    isApproved: { type: Boolean, default: false }, // admin approval
}, { timestamps: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
