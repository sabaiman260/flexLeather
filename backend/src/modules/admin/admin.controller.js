// controllers/admin/admin.controller.js

const User = require("../../models/user.model.js");
const Review = require("../../models/Review.model.js");
const Order = require("../../models/Order.model.js");
const Transaction = require("../../models/Transaction.model.js");
const Product = require("../../models/Product.model.js");
const { ApiError } = require("../../core/utils/api-error.js");
const { ApiResponse } = require("../../core/utils/api-response.js");
const { asyncHandler } = require("../../core/utils/async-handler.js");
const S3UploadHelper = require("../../shared/helpers/s3Upload.js");

// GET ADMIN PROFILE (since only one admin)
const getAdminProfile = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.user._id);
  return res.status(200).json(new ApiResponse(200, admin));
});

// UPDATE ADMIN PROFILE
const updateAdminProfile = asyncHandler(async (req, res) => {
  const updates = req.body;

  const admin = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true }
  );

  return res.status(200).json(new ApiResponse(200, admin, "Profile updated"));
});

// UPDATE PROFILE IMAGE
const updateAdminProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Image is required");

  const upload = await S3UploadHelper.uploadFile(req.file);

  const admin = await User.findByIdAndUpdate(
    req.user._id,
    { profileImage: upload.Location },
    { new: true }
  );

  return res.status(200).json(new ApiResponse(200, admin, "Image uploaded"));
});

// DELETE PROFILE IMAGE
const deleteAdminProfileImage = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.user._id);

  admin.profileImage = null;
  await admin.save();

  return res.status(200).json(new ApiResponse(200, admin, "Image removed"));
});

// TOGGLE BUYER STATUS (Block/Unblock)
const toggleBuyerStatus = asyncHandler(async (req, res) => {
  const buyer = await User.findById(req.params.id);
  if (!buyer) throw new ApiError(404, "Buyer not found");

  buyer.isActive = !buyer.isActive;
  await buyer.save();

  return res.status(200).json(
    new ApiResponse(200, buyer, `Buyer status updated (${buyer.isActive})`)
  );
});

// GET PENDING REVIEWS
const getPendingReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ isApproved: false })
    .populate("user", "userName profileImage")
    .populate("product", "name image");

  // Convert S3 keys to signed URLs
  const reviewsWithUrls = await Promise.all(reviews.map(async (review) => {
    let userProfileImage = null;
    if (review.user?.profileImage) {
      try {
        userProfileImage = await S3UploadHelper.getSignedUrl(review.user.profileImage);
      } catch (err) {
        console.error("Failed to get signed URL for user profile image:", err);
        userProfileImage = review.user.profileImage;
      }
    }

    const imageUrls = review.images && review.images.length > 0
      ? await Promise.all(review.images.map(async (key) => {
          try {
            return await S3UploadHelper.getSignedUrl(key);
          } catch (err) {
            console.error("Failed to get signed URL for review image:", err);
            return key;
          }
        }))
      : [];

    let userObj = null;
    if (review.user) {
      userObj = {
        ...review.user._doc,
        profileImage: userProfileImage
      };
    } else {
      userObj = {
        userName: review.guestDetails?.fullName || "Guest",
        profileImage: null,
        email: review.guestDetails?.email || null
      };
    }

    return {
      ...review._doc,
      user: userObj,
      imageUrls
    };
  }));

  return res.status(200).json(new ApiResponse(200, reviewsWithUrls));
});

// DASHBOARD STATS
const getDashboardStats = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const totalBuyers = await User.countDocuments({ role: "buyer" });
  const totalTransactions = await Transaction.countDocuments();
  const totalPendingReviews = await Review.countDocuments({ isApproved: false });
  const totalProducts = await Product.countDocuments();
  const pendingOrders = await Order.countDocuments({ orderStatus: "pending" });
  const pendingPayments = await Order.countDocuments({ paymentStatus: "pending" });

  const revenueResult = await Order.aggregate([
    { $match: { paymentStatus: "paid" } }, // Only count paid orders
    { $group: { _id: null, totalRevenue: { $sum: { $ifNull: ["$finalAmount", "$totalAmount"] } } } }
  ]);
  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      { 
        totalOrders, 
        totalBuyers, 
        totalTransactions, 
        totalPendingReviews,
        totalProducts,
        pendingOrders,
        pendingPayments,
        totalRevenue
      },
      "Dashboard stats loaded"
    )
  );
});

// SALES REPORT (daily or monthly)
const getSalesReport = asyncHandler(async (req, res) => {
  const range = (req.query.range || "daily").toString();
  const now = new Date();
  let startDate;
  if (range === "monthly") {
    // last 6 months
    startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 5);
    startDate.setDate(1);
  } else {
    // last 30 days
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 29);
    startDate.setHours(0, 0, 0, 0);
  }

  const groupId =
    range === "monthly"
      ? { $dateToString: { format: "%Y-%m", date: "$createdAt" } }
      : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };

  const pipeline = [
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: groupId,
        ordersCount: { $sum: 1 },
        revenue: {
          $sum: {
            $cond: [
              { $eq: ["$paymentStatus", "paid"] },
              { $ifNull: ["$finalAmount", "$totalAmount"] },
              0,
            ],
          },
        },
        paidCount: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] },
        },
        failedCount: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "failed"] }, 1, 0] },
        },
        pendingCount: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ];

  const results = await Order.aggregate(pipeline);
  return res
    .status(200)
    .json(
      new ApiResponse(200, { range, startDate, results }, "Sales report loaded")
    );
});

module.exports = {
  getAdminProfile,
  updateAdminProfile,
  updateAdminProfileImage,
  deleteAdminProfileImage,
  toggleBuyerStatus,
  getPendingReviews,
  getDashboardStats,
  getSalesReport
};
