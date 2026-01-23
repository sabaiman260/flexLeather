const { z } = require("zod");

const createVariantSchema = z.object({
    product: z.string().min(1, "Product ID is required"),
    name: z.string().min(2, "Variant name must be at least 2 characters"),
    price: z.number().min(0, "Price must be greater than 0"),
    stock: z.number().min(0, "Stock cannot be negative"),
    sku: z.string().min(1, "SKU is required")
});

const updateVariantSchema = createVariantSchema.partial();

module.exports = { createVariantSchema, updateVariantSchema };
