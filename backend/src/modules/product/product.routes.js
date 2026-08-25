import Router from "express";
import { upload } from "../../core/middleware/multer.js";
import { isLoggedIn } from "../../core/middleware/isLoggedIn.js";
import { isAdmin } from "../../core/middleware/isAdmin.js";
import { validate } from "../../core/middleware/validate.js";
import { cacheMiddleware } from "../../core/middleware/cacheMiddleware.js";
import { createProductSchema, updateProductSchema } from "../../shared/validators/product.validator.js";
import {
  getAllProducts,
  getAllProductsAdmin,
  getProductsByCategoryId,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductDetail,
  searchProducts,
  getProductsLite,
} from "./product.controller.js";

const productRouter = Router();

// Public routes with caching
productRouter.get("/getAll", cacheMiddleware(300), getAllProducts); // 5 min cache
productRouter.get("/lite", cacheMiddleware(300), getProductsLite); // Lightweight for autocomplete
productRouter.get("/getAllAdmin", isLoggedIn, isAdmin, getAllProductsAdmin);
productRouter.get("/category/:categoryId", cacheMiddleware(300), getProductsByCategoryId);
// Public product detail by slug (frontend URLs use slug; IDs stay for DB relations)
productRouter.get("/get/:slug", cacheMiddleware(600), getProductDetail); // 10 min cache
productRouter.get("/search", cacheMiddleware(180), searchProducts); // 3 min cache

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

export default productRouter;
