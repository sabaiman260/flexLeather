import { asyncHandler } from "../../core/utils/async-handler.js";
import Review from "../../models/Review.model.js";
import Product from "../../models/Product.model.js";
import Order from "../../models/Order.model.js";
import { ApiError } from "../../core/utils/api-error.js";
import { ApiResponse } from "../../core/utils/api-response.js";
import S3UploadHelper from "../../shared/helpers/s3Upload.js";

//-------------------- CREATE REVIEW --------------------//
const createReview = asyncHandler(async (req, res) => {
    const { product, rating, comment } = req.body;
    // Support guest reviews: if req.user exists treat as logged-in user, otherwise guest
    const isGuest = !req.user;
    const userId = req.user ? req.user._id : null;

    const productExists = await Product.findById(product);
    if (!productExists) throw new ApiError(404, "Product not found");

    // For logged-in users only: ensure they have at least one paid & delivered order
    if (!isGuest) {
        const eligibleOrder = await Order.findOne({
            buyer: userId,
            orderStatus: 'delivered',
            paymentStatus: 'paid'
        });
        if (!eligibleOrder) {
            throw new ApiError(403, "You can only submit reviews for products from paid and delivered orders");
        }
    }

    let images = [];
    if (req.files) {
        for (let file of req.files) {
            const uploadResult = await S3UploadHelper.uploadFile(file, "reviews");
            images.push(uploadResult.key);
        }
    }

    const reviewPayload = {
        user: userId,
        product,
        rating,
        comment,
        images,
        isApproved: false, // admin will approve
        isGuest: isGuest
    };

    // If guest, persist provided guest details (fullName, email) when available
    if (isGuest) {
        const { fullName, email } = req.body;
        if (fullName) reviewPayload.guestDetails = reviewPayload.guestDetails || {};
        if (email) reviewPayload.guestDetails = { ...(reviewPayload.guestDetails || {}), email };
        if (fullName) reviewPayload.guestDetails = { ...(reviewPayload.guestDetails || {}), fullName };
        // ensure user is explicitly null for guest reviews
        reviewPayload.user = null;
    }

    const review = await Review.create(reviewPayload);

    return res.status(201).json(new ApiResponse(201, review, "Review created successfully"));
});

//-------------------- GET REVIEWS FOR PRODUCT --------------------//
const getReviews = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 0; // 0 => no limit (return all)

    const filter = { product: req.params.productId, isApproved: true };
    const total = await Review.countDocuments(filter);

    let query = Review.find(filter).populate("user", "userName profileImage");
    if (limit > 0) {
        const skip = (page - 1) * limit;
        query = query.skip(skip).limit(limit);
    }

    const reviews = await query.exec();

    const withUrls = await Promise.all(reviews.map(async (r) => {
        const imageUrls = await Promise.all((r.images || []).map(async (key) => {
            try {
                return await S3UploadHelper.getSignedUrl(key);
            } catch (err) {
                console.error('Failed to get signed url for review image', err);
                return key;
            }
        }));
        return { ...r._doc, imageUrls };
    }));

    return res.status(200).json(new ApiResponse(200, { reviews: withUrls, total, page, limit }, "Reviews fetched successfully"));
});

//-------------------- APPROVE REVIEW --------------------//
const approveReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) throw new ApiError(404, "Review not found");

    review.isApproved = true;
    await review.save();

    return res.status(200).json(new ApiResponse(200, review, "Review approved successfully"));
});

//-------------------- DELETE REVIEW --------------------//
const deleteReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) throw new ApiError(404, "Review not found");

    await review.remove();
    return res.status(200).json(new ApiResponse(200, {}, "Review deleted successfully"));
});

export { createReview, getReviews, approveReview, deleteReview };
