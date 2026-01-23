const { Router } = require("express");
const { upload } = require("../../core/middleware/multer.js");
const { isLoggedIn, optionalAuth } = require("../../core/middleware/isLoggedIn.js");
const { isAdmin } = require("../../core/middleware/isAdmin.js");
const { validate } = require("../../core/middleware/validate.js");
const { createReviewSchema } = require("../../shared/validators/review.validator.js");
const { createReview, getReviews, approveReview, deleteReview } = require("./review.controller.js");

const reviewRouter = Router();

//-------------------- PUBLIC ROUTES --------------------//
reviewRouter.get("/product/:productId", getReviews);

//-------------------- REVIEW SUBMISSION (AUTH OPTIONAL) --------------------//
// Allow both authenticated and unauthenticated users to submit reviews.
// Use `optionalAuth` so `req.user` is available when a valid token is provided,
// but guests won't receive 401.
reviewRouter.post("/", optionalAuth, upload.array("images"), validate(createReviewSchema), createReview);

//-------------------- ADMIN ROUTES --------------------//
reviewRouter.put("/approve/:id", isLoggedIn, isAdmin, approveReview);
reviewRouter.delete("/:id", isLoggedIn, isAdmin, deleteReview);

module.exports = reviewRouter;
