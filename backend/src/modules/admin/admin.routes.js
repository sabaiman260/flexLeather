import Router from "express";
import { upload } from "../../core/middleware/multer.js";
import { isLoggedIn } from "../../core/middleware/isLoggedIn.js";
import { isAdmin } from "../../core/middleware/isAdmin.js";

import {
    getAdminProfile,
    updateAdminProfile,
    updateAdminProfileImage,
    deleteAdminProfileImage,
    toggleBuyerStatus,
    getPendingReviews,
    getDashboardStats,
    getSalesReport
} from "./admin.controller.js";

const adminRouter = Router();

// Only admin can access these routes
adminRouter.use(isLoggedIn, isAdmin);

// Admin Profile
adminRouter.get("/profile", getAdminProfile);
adminRouter.put("/profile", updateAdminProfile);

// Profile Image
adminRouter.put("/profile/image", upload.single("profileImage"), updateAdminProfileImage);
adminRouter.delete("/profile/image", deleteAdminProfileImage);

// Buyer Management
adminRouter.patch("/buyer/toggle-status/:id", toggleBuyerStatus);

// Review Moderation
adminRouter.get("/reviews/pending", getPendingReviews);

// Dashboard Analytics
adminRouter.get("/dashboard/stats", getDashboardStats);
adminRouter.get("/dashboard/reports/sales", getSalesReport);

export default adminRouter;
