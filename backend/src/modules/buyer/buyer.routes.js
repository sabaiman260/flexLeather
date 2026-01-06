import Router from "express";
import { upload } from "../../core/middleware/multer.js";
import { isLoggedIn } from "../../core/middleware/isLoggedIn.js";
import { isBuyer } from "../../core/middleware/isBuyer.js";

import {
    getBuyerProfile,
    updateBuyerProfile,
    deleteBuyerProfile,
    updateBuyerProfileImage,
    deleteBuyerProfileImage,
    getMyOrders,
    getMyTransactions
} from "./buyer.controller.js";

const buyerRouter = Router();

// Buyer must be logged in and have buyer role
buyerRouter.use(isLoggedIn, isBuyer);

// Buyer Profile
buyerRouter.get("/profile", getBuyerProfile);
buyerRouter.put("/profile", updateBuyerProfile);
buyerRouter.delete("/profile", deleteBuyerProfile);

// Profile Image
buyerRouter.put("/profile/image", upload.single("profileImage"), updateBuyerProfileImage);
buyerRouter.delete("/profile/image", deleteBuyerProfileImage);

// Orders
buyerRouter.get("/orders", getMyOrders);

// Transactions
buyerRouter.get("/transactions", getMyTransactions);

export default buyerRouter;
