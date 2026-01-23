const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", required: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    transactionDate: { type: Date, default: Date.now }
}, { timestamps: true });

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;
