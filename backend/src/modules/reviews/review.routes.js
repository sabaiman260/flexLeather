import Router from "express";
import { upload } from "../../core/middleware/multer.js";
import { isLoggedIn, optionalAuth } from "../../core/middleware/isLoggedIn.js";
import { isAdmin } from "../../core/middleware/isAdmin.js";
import { validate } from "../../core/middleware/validate.js";
import { createReviewSchema } from "../../shared/validators/review.validator.js";
import { createReview, getReviews, approveReview, deleteReview } from "./review.controller.js";

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

export default reviewRouter;
