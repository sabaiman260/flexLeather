const User = require("../../models/user.model.js");
const Order = require("../../models/order/order.model.js");
const Transaction = require("../../models/transaction/transaction.model.js");
const { ApiError } = require("../../utils/ApiError.js");
const { ApiResponse } = require("../../utils/ApiResponse.js");
const asyncHandler = require("../../utils/async-handler.js");
const S3UploadHelper = require("../../utils/S3UploadHelper.js");

// GET ALL BUYERS
const getAllBuyers = asyncHandler(async (req, res) => {
  const buyers = await User.find();
  return res
    .status(200)
    .json(new ApiResponse(200, buyers, "All buyers fetched"));
});

// GET BUYER BY ID
const getBuyer = asyncHandler(async (req, res) => {
  const buyer = await User.findById(req.params.id);
  if (!buyer) throw new ApiError(404, "Buyer not found");

  return res.status(200).json(new ApiResponse(200, buyer));
});

// GET MY PROFILE
const getProfile = asyncHandler(async (req, res) => {
  const buyer = await User.findById(req.user._id);
  return res.status(200).json(new ApiResponse(200, buyer));
});

// UPDATE PROFILE
const updateProfile = asyncHandler(async (req, res) => {
  const updates = req.body;

  const buyer = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, buyer, "Profile updated"));
});

// DELETE PROFILE
const deleteProfile = asyncHandler(async (req, res) => {
  await Buyer.findByIdAndDelete(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Buyer profile deleted"));
});

// UPDATE PROFILE IMAGE
const updateProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Image is required");

  const upload = await S3UploadHelper.uploadFile(req.file);

  const buyer = await User.findByIdAndUpdate(
    req.user._id,
    { profileImage: upload.Location },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, buyer, "Image updated"));
});

// DELETE PROFILE IMAGE
const deleteProfileImage = asyncHandler(async (req, res) => {
  const buyer = await User.findById(req.user._id);

  buyer.profileImage = null;
  await buyer.save();

  return res
    .status(200)
    .json(new ApiResponse(200, buyer, "Image removed"));
});

// GET MY ORDERS
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ buyer: req.user._id })
    .populate("items.product");

  return res
    .status(200)
    .json(new ApiResponse(200, orders, "My orders"));
});

// GET MY TRANSACTIONS
const getMyTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ buyer: req.user._id });

  return res
    .status(200)
    .json(new ApiResponse(200, transactions));
});

module.exports = {
  getAllBuyers,
  getBuyer,
  getProfile,
  updateProfile,
  deleteProfile,
  updateProfileImage,
  deleteProfileImage,
  getMyOrders,
  getMyTransactions,

  // Aliases expected by routes
  getBuyerProfile: getProfile,
  updateBuyerProfile: updateProfile,
  deleteBuyerProfile: deleteProfile,
  updateBuyerProfileImage: updateProfileImage,
  deleteBuyerProfileImage: deleteProfileImage
};
