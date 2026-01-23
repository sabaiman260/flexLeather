const { z } = require("zod");

const createTransactionSchema = z.object({
    paymentId: z.string().min(1, "Payment ID is required"),
    type: z.enum(["payment", "refund"]),
    amount: z.number().min(0, "Amount must be greater than 0"),
    description: z.string().optional()
});

module.exports = { createTransactionSchema };
