const { z } = require("zod");

// Helper to allow comma-separated strings or array
const stringOrArray = z.union([
  z.string().transform((val) => val.split(",").map((v) => v.trim()).filter(Boolean)),
  z.array(z.string()),
]);

// Create product
const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").trim(),
  description: z.string().optional().nullable(),
  price: z.preprocess((val) => Number(val), z.number().min(0)),
  discount: z.preprocess((val) => Number(val ?? 0), z.number().min(0)).optional(),
  stock: z.preprocess((val) => Number(val ?? 0), z.number().min(0)).optional(),
  category: z.string().min(1, "Category is required"),
  sizes: stringOrArray.optional(),
  colors: stringOrArray.optional(),
  specs: stringOrArray.optional(),
  isActive: z.preprocess(
    (val) => (typeof val === "string" ? val === "true" : val),
    z.boolean().optional()
  ),
});

const updateProductSchema = z.object({
    name: z.preprocess((val) => (typeof val === "string" ? val.trim() : val), z.string()).optional(),
    description: z.string().optional().nullable(),
    price: z.preprocess((val) => (val !== undefined ? Number(val) : undefined), z.number().min(0).optional()),
    discount: z.preprocess((val) => (val !== undefined ? Number(val) : undefined), z.number().min(0).optional()),
    stock: z.preprocess((val) => (val !== undefined ? Number(val) : undefined), z.number().min(0).optional()),
    category: z.string().optional(),
    sizes: z.union([
      z.array(z.string()),
      z.preprocess((val) => (typeof val === "string" ? val.split(",").map((v) => v.trim()) : val), z.array(z.string()))
    ]).optional(),
    colors: z.union([
      z.array(z.string()),
      z.preprocess((val) => (typeof val === "string" ? val.split(",").map((v) => v.trim()) : val), z.array(z.string()))
    ]).optional(),
    specs: z.union([
      z.array(z.string()),
      z.preprocess((val) => (typeof val === "string" ? val.split(",").map((v) => v.trim()) : val), z.array(z.string()))
    ]).optional(),
    isActive: z.preprocess(
      (val) => (typeof val === "string" ? val === "true" : val),
      z.boolean().optional()
    )
  });

module.exports = { createProductSchema, updateProductSchema };
  
