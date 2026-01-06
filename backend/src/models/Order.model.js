import mongoose from "mongoose";

const guestDetailsSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true }
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant" },
    selectedColor: { type: String },
    selectedSize: { type: String },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    // If user logged in → stored here
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // If guest order → stored here
    guestDetails: { type: guestDetailsSchema },

    // Order products
    items: {
        type: [orderItemSchema],
        required: true
    },

    totalAmount: { type: Number, required: true },

    finalAmount: { type: Number }, // Populated server-side

    paymentMethod: {
        type: String,
        enum: ["cod", "jazzcash", "easypaisa", "card", "payfast"],
        required: true
    },

    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending"
    },

    orderStatus: {
        type: String,
        enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
        default: "pending"
    },

    // Shipping address → ALWAYS required (buyer or guest)
    shippingAddress: { type: String, required: true },

    trackingNumber: { type: String }
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);
export default Order;
