//-------------------- CREATE TRANSACTION --------------------//
const { asyncHandler } = require("../../core/utils/async-handler.js");
const Transaction = require("../../models/Transaction.model.js");
const Payment = require("../../models/Payment.model.js");
const { ApiError } = require("../../core/utils/api-error.js");
const { ApiResponse } = require("../../core/utils/api-response.js");

//-------------------- CREATE TRANSACTION --------------------//
const createTransaction = asyncHandler(async (req, res) => {
    const { paymentId, type, amount, description } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) throw new ApiError(404, "Payment not found");

    const transaction = await Transaction.create({
        payment: paymentId,
        type,
        amount,
        description,
        status: "completed"
    });

    return res.status(201).json(new ApiResponse(201, transaction, "Transaction created successfully"));
});

//-------------------- GET TRANSACTIONS --------------------//
const getTransactions = asyncHandler(async (req, res) => {
    const transactions = await Transaction.find().populate("payment");
    return res.status(200).json(new ApiResponse(200, transactions, "Transactions fetched successfully"));
});

//-------------------- GET SINGLE TRANSACTION --------------------//
const getTransaction = asyncHandler(async (req, res) => {
    const transaction = await Transaction.findById(req.params.id).populate("payment");
    if (!transaction) throw new ApiError(404, "Transaction not found");
    return res.status(200).json(new ApiResponse(200, transaction, "Transaction fetched successfully"));
});

module.exports = { createTransaction, getTransactions, getTransaction };
