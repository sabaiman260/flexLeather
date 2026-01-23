const mongoose = require("mongoose");

const guestDetailsSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
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

    // If guest order → stored here (conditionally required via pre-validate hook)
    guestDetails: { type: guestDetailsSchema },

    // Order products
    items: {
        type: [orderItemSchema],
        required: true,
        validate: {
            validator: function(items) {
                return items && items.length > 0;
            },
            message: 'Order must contain at least one item'
        }
    },

    // Includes product subtotal + shipping (fixed)
    totalAmount: {
        type: Number,
        required: true,
        min: [0, 'Total amount must be positive']
    },

    // Same as totalAmount for now; kept for compatibility
    finalAmount: {
        type: Number,
        default: function() { return this.totalAmount; }
    },

    // Store applied shipping for clarity in admin views
    shippingCost: {
        type: Number,
        default: 0,
        min: [0, 'Shipping cost cannot be negative']
    },

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

    // Store last manual payment transaction/reference id (optional)
    paymentTransactionId: { type: String, default: null },

    // Track whether we have sent a payment confirmation email to the customer
    paymentConfirmationSent: {
        type: Boolean,
        default: false
    },

    // Track whether we have sent the order confirmation email (e.g., for COD)
    orderConfirmationSent: {
        type: Boolean,
        default: false
    },

    orderStatus: {
        type: String,
        enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
        default: "pending"
    },

    // Shipping address → ALWAYS required (buyer or guest)
    shippingAddress: {
        type: String,
        required: true,
        trim: true,
        minlength: [5, 'Shipping address must be at least 5 characters']
    },

    trackingNumber: { type: String }
}, { timestamps: true });

// Pre-save validation to ensure either buyer OR guestDetails is present
orderSchema.pre('validate', function(next) {
    const order = this;

    // Must have either a buyer OR guestDetails, but not both missing
    if (!order.buyer && !order.guestDetails) {
        return next(new Error('Order must have either a buyer or guestDetails'));
    }

    // Cannot have both buyer and guestDetails
    if (order.buyer && order.guestDetails) {
        return next(new Error('Order cannot have both buyer and guestDetails'));
    }

    // If it's a guest order, ensure guestDetails has all required fields
    if (!order.buyer && order.guestDetails) {
        const gd = order.guestDetails;
        if (!gd.fullName || !gd.email || !gd.phone || !gd.address) {
            return next(new Error('Guest orders require complete guestDetails (fullName, email, phone, address)'));
        }
    }

    next();
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
