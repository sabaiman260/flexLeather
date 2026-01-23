const { z } = require("zod");

const createReviewSchema = z.object({
    product: z.string().min(1, "Product ID is required"),
    orderId: z.string().min(1, "Order ID is required"),
    rating: z.coerce.number().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
    comment: z.string().min(5, "Comment must be at least 5 characters long")
});

module.exports = { createReviewSchema };
