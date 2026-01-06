import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    method: { type: String, enum: ["cod", "jazzcash", "easypaisa", "card", "payfast"], required: true },
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    amount: { type: Number, required: true },
    transactionId: { type: String },
    paymentDate: { type: Date, default: Date.now },
}, { timestamps: true });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
