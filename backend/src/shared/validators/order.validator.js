const { z } = require("zod");

const guestDetailsSchema = z.object({
    fullName: z.string().min(3, "Full name is required"),
    email: z.string().email("Valid email required"),
    phone: z.string().min(10, "Valid phone number is required"),
    address: z.string().min(5, "Address is required"),
});

const orderItemSchema = z.object({
    productId: z.string().min(1, "Product ID required"),
    variantId: z.string().optional(),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    price: z.number().min(0, "Price must be >= 0"),
    selectedColor: z.string().optional(),
    selectedSize: z.string().optional()
});

const createOrderSchema = z.object({
    items: z.array(orderItemSchema).min(1, "Order must contain at least 1 item"),

    totalAmount: z.number().min(1, "Total amount must be at least 1"),

    // Allow PayFast so validation matches available gateways
    paymentMethod: z.enum(["cod", "jazzcash", "easypaisa", "card", "payfast"]),

    guestDetails: guestDetailsSchema.optional()
});

const updateOrderStatusSchema = z.object({
    status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"])
});

const updateOrderPaymentSchema = z.object({
    status: z.enum(["pending", "paid", "failed"])
});

module.exports = { guestDetailsSchema, orderItemSchema, createOrderSchema, updateOrderStatusSchema, updateOrderPaymentSchema };
