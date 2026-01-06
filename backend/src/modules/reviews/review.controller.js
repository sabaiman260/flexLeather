import { asyncHandler } from "../../core/utils/async-handler.js";
import Review from "../../models/Review.model.js";
import Product from "../../models/Product.model.js";
import { ApiError } from "../../core/utils/api-error.js";
import { ApiResponse } from "../../core/utils/api-response.js";
import S3UploadHelper from "../../shared/helpers/s3Upload.js";

//-------------------- CREATE REVIEW --------------------//
const createReview = asyncHandler(async (req, res) => {
    const { product, rating, comment } = req.body;
    const user = req.user._id;

    const productExists = await Product.findById(product);
    if (!productExists) throw new ApiError(404, "Product not found");

    let images = [];
    if (req.files) {
        for (let file of req.files) {
            const uploadResult = await S3UploadHelper.uploadFile(file, "reviews");
            images.push(uploadResult.key);
        }
    }

    const review = await Review.create({
        user,
        product,
        rating,
        comment,
        images,
        isApproved: false // admin will approve
    });

    return res.status(201).json(new ApiResponse(201, review, "Review created successfully"));
});

//-------------------- GET REVIEWS FOR PRODUCT --------------------//
const getReviews = asyncHandler(async (req, res) => {
    const reviews = await Review.find({ product: req.params.productId, isApproved: true })
        .populate("user", "userName profileImage");

    const withUrls = await Promise.all(reviews.map(async (r) => {
        const imageUrls = await Promise.all((r.images || []).map(key => S3UploadHelper.getSignedUrl(key)));
        return { ...r._doc, imageUrls };
    }));

    return res.status(200).json(new ApiResponse(200, withUrls, "Reviews fetched successfully"));
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
