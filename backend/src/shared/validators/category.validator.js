const { z } = require("zod");

// Helper to trim strings
const trimmedString = () =>
  z.preprocess((val) => (typeof val === "string" ? val.trim() : val), z.string());

// Fixed categories array
const FIXED_CATEGORIES = ["MEN", "WOMEN", "KIDS", "OFFICE", "GIFT IDEAS"];

// Schema for creating a category
const createCategorySchema = z.object({
  type: trimmedString().optional().refine(
    (val) => !val || FIXED_CATEGORIES.includes(val.toUpperCase()),
    { message: "Invalid type" }
  ),
  name: trimmedString(),
  parentCategory: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional()
});

// Schema for updating a category
const updateCategorySchema = z.object({
  type: trimmedString().optional().refine(
    (val) => !val || FIXED_CATEGORIES.includes(val.toUpperCase()),
    { message: "Invalid type" }
  ),
  name: trimmedString().optional(),
  parentCategory: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional()
});

module.exports = { FIXED_CATEGORIES, createCategorySchema, updateCategorySchema };
