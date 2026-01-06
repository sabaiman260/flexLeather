import User from "../../models/user.model.js";
import Order from "../../models/order/order.model.js";
import Transaction from "../../models/transaction/transaction.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/async-handler.js";
import S3UploadHelper from "../../utils/S3UploadHelper.js";

// GET ALL BUYERS
export const getAllBuyers = asyncHandler(async (req, res) => {
  const buyers = await User.find();
  return res
    .status(200)
    .json(new ApiResponse(200, buyers, "All buyers fetched"));
});

// GET BUYER BY ID
export const getBuyer = asyncHandler(async (req, res) => {
  const buyer = await User.findById(req.params.id);
  if (!buyer) throw new ApiError(404, "Buyer not found");

  return res.status(200).json(new ApiResponse(200, buyer));
});

// GET MY PROFILE
export const getProfile = asyncHandler(async (req, res) => {
  const buyer = await User.findById(req.user._id);
  return res.status(200).json(new ApiResponse(200, buyer));
});

// UPDATE PROFILE
export const updateProfile = asyncHandler(async (req, res) => {
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
export const deleteProfile = asyncHandler(async (req, res) => {
  await Buyer.findByIdAndDelete(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Buyer profile deleted"));
});

// UPDATE PROFILE IMAGE
export const updateProfileImage = asyncHandler(async (req, res) => {
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
export const deleteProfileImage = asyncHandler(async (req, res) => {
  const buyer = await User.findById(req.user._id);

  buyer.profileImage = null;
  await buyer.save();

  return res
    .status(200)
    .json(new ApiResponse(200, buyer, "Image removed"));
});

// GET MY ORDERS
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ buyer: req.user._id })
    .populate("items.product");

  return res
    .status(200)
    .json(new ApiResponse(200, orders, "My orders"));
});

// GET MY TRANSACTIONS
export const getMyTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ buyer: req.user._id });

  return res
    .status(200)
    .json(new ApiResponse(200, transactions));
});
