import { asyncHandler } from "../../core/utils/async-handler.js";
import Category from "../../models/Category.model.js";
import Product from "../../models/Product.model.js";
import { ApiError } from "../../core/utils/api-error.js";
import { ApiResponse } from "../../core/utils/api-response.js";

// Get all categories (with populated parentCategory)
const getAllCategories = asyncHandler(async (req, res) => {
  const includeInactive = req.query.includeInactive === "true";
  const query = includeInactive ? {} : { isActive: true };

  const categories = await Category.find(query)
    .populate("parentCategory", "name slug")
    .sort({ name: 1 });
  return res.status(200).json(new ApiResponse(200, categories, "Categories fetched"));
});

// Create category (admin)
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, parentCategory, isActive } = req.body;

  if (!name) throw new ApiError(400, "Category name is required");

  const formattedName = name.trim();
  const parentId = parentCategory && parentCategory !== "" ? parentCategory : null;

  // Check if category with exact name and same parent exists
  const existing = await Category.findOne({
    name: { $regex: new RegExp(`^${formattedName}$`, 'i') },
    parentCategory: parentId
  });

  if (existing) {
    return res
      .status(200)
      .json(new ApiResponse(200, existing, "Category already exists"));
  }

  // Generate parent-prefixed slug
  let cleanNameSlug = formattedName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-");

  let slug = cleanNameSlug;
  if (parentId) {
    const parent = await Category.findById(parentId);
    if (parent) {
      const parentSlug = (parent.slug || parent.name).toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      slug = `${parentSlug}-${cleanNameSlug}`;
    }
  }

  const category = await Category.create({
    name: formattedName,
    slug,
    parentCategory: parentId,
    description: description || `${formattedName} category`,
    isActive: isActive !== undefined ? isActive : true
  });

  const populated = await Category.findById(category._id).populate("parentCategory", "name slug");
  return res.status(201).json(new ApiResponse(201, populated, "Category created successfully"));
});

// Update category (admin)
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");

  const { name, description, parentCategory, isActive } = req.body;

  if (parentCategory !== undefined) {
    category.parentCategory = parentCategory && parentCategory !== "" ? parentCategory : null;
  }

  if (name) {
    category.name = name.trim();
    let cleanNameSlug = category.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-");

    const parentId = category.parentCategory;
    if (parentId) {
      const parent = await Category.findById(parentId);
      if (parent) {
        const parentSlug = (parent.slug || parent.name).toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
        cleanNameSlug = `${parentSlug}-${cleanNameSlug}`;
      }
    }
    category.slug = cleanNameSlug;
  }

  if (description !== undefined) category.description = description;
  if (isActive !== undefined) category.isActive = isActive;

  await category.save();
  const populated = await Category.findById(category._id).populate("parentCategory", "name slug");
  return res.status(200).json(new ApiResponse(200, populated, "Category updated successfully"));
});

// Delete category (admin)
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");

  // Check if any subcategories belong to this category
  const subcategoriesCount = await Category.countDocuments({ parentCategory: category._id });
  if (subcategoriesCount > 0) {
    throw new ApiError(400, `Cannot delete category: it contains ${subcategoriesCount} subcategory(ies). Please reassign or delete them first.`);
  }

  // Check if any products are assigned to this category
  const productsCount = await Product.countDocuments({ category: category._id });
  if (productsCount > 0) {
    throw new ApiError(400, `Cannot delete category: ${productsCount} product(s) are assigned to it. Please reassign or remove them first.`);
  }

  await category.deleteOne();
  return res.status(200).json(new ApiResponse(200, {}, "Category deleted successfully"));
});

// Search categories
const searchCategories = asyncHandler(async (req, res) => {
  const { name } = req.query;
  if (!name) throw new ApiError(400, "Search query is required");

  const categories = await Category.find({
    name: { $regex: name, $options: "i" },
    isActive: true
  }).populate("parentCategory", "name slug");

  return res.status(200).json(new ApiResponse(200, categories, "Categories fetched"));
});

export {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  searchCategories
};
