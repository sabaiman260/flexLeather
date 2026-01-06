import { z } from "zod";

const createPaymentSchema = z.object({
    orderId: z.string().min(1, "Order ID is required"),
    method: z.enum(["cod", "jazzcash", "easypaisa", "card", "payfast"]),
    mobileNumber: z.string().optional() // Optional, will be read from order if missing
});

const updatePaymentStatusSchema = z.object({
    status: z.enum(["pending", "success", "failed"]),
    transactionId: z.string().optional()
});

export { createPaymentSchema, updatePaymentStatusSchema };
