const { Router } = require("express");
const { upload } = require("../../core/middleware/multer.js");
const { isLoggedIn } = require("../../core/middleware/isLoggedIn.js");
const { isBuyer } = require("../../core/middleware/isBuyer.js");

const {
    getBuyerProfile,
    updateBuyerProfile,
    deleteBuyerProfile,
    updateBuyerProfileImage,
    deleteBuyerProfileImage,
    getMyOrders,
    getMyTransactions
} = require("./buyer.controller.js");

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

module.exports = buyerRouter;
