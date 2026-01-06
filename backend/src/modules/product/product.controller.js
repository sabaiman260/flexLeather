import { asyncHandler } from "../../core/utils/async-handler.js";
import Product from "../../models/Product.model.js";
import Category from "../../models/Category.model.js";
import { ApiError } from "../../core/utils/api-error.js";
import { ApiResponse } from "../../core/utils/api-response.js";
import S3UploadHelper from "../../shared/helpers/s3Upload.js";

// Get all products
const getAllProducts = asyncHandler(async (_req, res) => {
  const products = await Product.find({ isActive: true }).populate(
    "category",
    "name slug"
  );

  const productsWithUrls = await Promise.all(
    products.map(async (p) => {
      const imageUrls = await Promise.all(
        p.images.map((key) => S3UploadHelper.getSignedUrl(key))
      );
      return { ...p._doc, imageUrls };
    })
  );

  return res
    .status(200)
    .json(new ApiResponse(200, productsWithUrls, "All products fetched"));
});

// Get products by category ID
const getProductsByCategoryId = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  if (!categoryId) throw new ApiError(400, "Category is required");

  let category = await Category.findOne({ slug: categoryId });
  if (!category) {
    category = await Category.findById(categoryId);
  }
  if (!category) throw new ApiError(404, "Category not found");

  // Fetch products by category _id
  const products = await Product.find({ category: category._id, isActive: true }).populate(
    "category",
    "name slug"
  );

  const productsWithUrls = await Promise.all(
    products.map(async (p) => {
      const imageUrls = await Promise.all(
        p.images.map((key) => S3UploadHelper.getSignedUrl(key))
      );
      return { ...p._doc, imageUrls };
    })
  );

  return res.status(200).json(new ApiResponse(200, productsWithUrls, "Products fetched by category"));
});


// Create product
const createProduct = asyncHandler(async (req, res) => {
  let {
    name,
    description,
    price,
    discount,
    stock,
    category,
    sizes,
    colors,
    specs,
    isActive,
  } = req.body;

  if (!name || !price || !category)
    throw new ApiError(400, "Name, price and category are required");

  const toNumber = (v) => (v === undefined ? undefined : Number(v));
  const toArray = (v) =>
    Array.isArray(v)
      ? v
      : typeof v === "string"
      ? v.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  price = toNumber(price);
  discount = toNumber(discount) ?? 0;
  stock = toNumber(stock) ?? 0;
  sizes = toArray(sizes);
  colors = toArray(colors);
  specs = toArray(specs);
  isActive = typeof isActive === "string" ? isActive === "true" : true;

  // Upload images to S3
  let imageKeys = [];
  if (Array.isArray(req.files) && req.files.length > 0) {
    try {
      const uploads = await S3UploadHelper.uploadMultipleFiles(
        req.files,
        "product-images"
      );
      imageKeys = uploads.map((u) => u.key);
    } catch (err) {
      console.error("Product image upload failed:", err);
      imageKeys = [];
    }
  }

  let product;
  try {
    product = await Product.create({
      name,
      description,
      price,
      discount,
      stock,
      category,
      sizes,
      colors,
      specs,
      images: imageKeys,
      isActive,
    });
  } catch (err) {
    if (err && (err.code === 11000 || err.name === "MongoServerError")) {
      throw new ApiError(400, "Product with the same name already exists");
    }
    console.error("Product create error:", err);
    throw new ApiError(500, "Failed to create product");
  }

  let imageUrls = [];
  try {
    imageUrls = await Promise.all(
      product.images.map((key) => S3UploadHelper.getSignedUrl(key))
    );
  } catch (err) {
    console.error("Product image signed URL generation failed:", err);
    imageUrls = [];
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, { product, imageUrls }, "Product created successfully")
    );
});

// Update product
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");

  let {
    name,
    description,
    price,
    discount,
    stock,
    category,
    sizes,
    colors,
    specs,
    isActive,
  } = req.body;

  const toNumber = (v) => (v === undefined ? undefined : Number(v));
  const toArray = (v) =>
    Array.isArray(v)
      ? v
      : typeof v === "string"
      ? v.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;

  if (name) product.name = name;
  if (description) product.description = description;
  if (price !== undefined) product.price = toNumber(price);
  if (discount !== undefined) product.discount = toNumber(discount);
  if (stock !== undefined) product.stock = toNumber(stock);
  if (category) product.category = category;
  if (sizes) product.sizes = toArray(sizes);
  if (colors) product.colors = toArray(colors);
  if (specs) product.specs = toArray(specs);
  if (isActive !== undefined)
    product.isActive = typeof isActive === "string" ? isActive === "true" : isActive;

  // Upload new images
  if (Array.isArray(req.files) && req.files.length > 0) {
    try {
      const uploads = await S3UploadHelper.uploadMultipleFiles(
        req.files,
        "product-images"
      );
      product.images = uploads.map((u) => u.key);
    } catch (err) {
      console.error("Product image upload failed:", err);
    }
  }

  await product.save();

  let imageUrls = [];
  try {
    imageUrls = await Promise.all(
      product.images.map((key) => S3UploadHelper.getSignedUrl(key))
    );
  } catch (err) {
    console.error("Product image signed URL generation failed:", err);
    imageUrls = [];
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { product, imageUrls }, "Product updated successfully")
    );
});

// Delete product
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Product deleted successfully"));
});

// Product detail
const getProductDetail = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate(
    "category",
    "name slug"
  );
  if (!product || !product.isActive) throw new ApiError(404, "Product not found");

  const imageUrls = await Promise.all(
    product.images.map((key) => S3UploadHelper.getSignedUrl(key))
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { product, imageUrls }, "Product detail fetched"));
});

// Search products
const searchProducts = asyncHandler(async (req, res) => {
  const { name } = req.query;
  if (!name) throw new ApiError(400, "Search query required");

  const products = await Product.find({
    name: { $regex: name, $options: "i" },
    isActive: true,
  }).populate("category", "name slug");

  const productsWithUrls = await Promise.all(
    products.map(async (p) => {
      const imageUrls = await Promise.all(
        p.images.map((key) => S3UploadHelper.getSignedUrl(key))
      );
      return { ...p._doc, imageUrls };
    })
  );

  return res
    .status(200)
    .json(new ApiResponse(200, productsWithUrls, "Product search results"));
});

export {
  getAllProducts,
  getProductsByCategoryId,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductDetail,
  searchProducts,
};
