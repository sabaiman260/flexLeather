const { Router } = require("express");
const { upload } = require("../../core/middleware/multer.js");
const { isLoggedIn } = require("../../core/middleware/isLoggedIn.js");
const { isAdmin } = require("../../core/middleware/isAdmin.js");
const { validate } = require("../../core/middleware/validate.js");
const { createProductSchema, updateProductSchema } = require("../../shared/validators/product.validator.js");
const {
  getAllProducts,
  getProductsByCategoryId,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductDetail,
  searchProducts,
} = require("./product.controller.js");

const productRouter = Router();

// Public routes
productRouter.get("/getAll", getAllProducts);
productRouter.get("/category/:categoryId", getProductsByCategoryId); // by ID
productRouter.get("/get/:id", getProductDetail);
productRouter.get("/search", searchProducts);

// Admin routes
productRouter.post(
  "/create",
  isLoggedIn,
  isAdmin,
  upload.array("images"),
  validate(createProductSchema),
  createProduct
);

productRouter.put(
  "/update/:id",
  isLoggedIn,
  isAdmin,
  upload.array("images"),
  validate(updateProductSchema),
  updateProduct
);

productRouter.delete("/delete/:id", isLoggedIn, isAdmin, deleteProduct);

module.exports = productRouter;
