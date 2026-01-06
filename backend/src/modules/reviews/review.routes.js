import Router from "express";
import { upload } from "../../core/middleware/multer.js";
import { isLoggedIn } from "../../core/middleware/isLoggedIn.js";
import { isAdmin } from "../../core/middleware/isAdmin.js";
import { validate } from "../../core/middleware/validate.js";
import { createReviewSchema } from "../../shared/validators/review.validator.js";
import { createReview, getReviews, approveReview, deleteReview } from "./review.controller.js";

const reviewRouter = Router();

//-------------------- PUBLIC ROUTES --------------------//
reviewRouter.get("/product/:productId", getReviews);

//-------------------- AUTHENTICATED ROUTES --------------------//
reviewRouter.post("/", isLoggedIn, upload.array("images"),validate(createReviewSchema), createReview);

//-------------------- ADMIN ROUTES --------------------//
reviewRouter.put("/approve/:id", isLoggedIn, isAdmin, approveReview);
reviewRouter.delete("/:id", isLoggedIn, isAdmin, deleteReview);

export default reviewRouter;
