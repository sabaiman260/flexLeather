import Router from "express";
import { upload } from "../../core/middleware/multer.js";
import { isLoggedIn } from "../../core/middleware/isLoggedIn.js";
import { isAdmin } from "../../core/middleware/isAdmin.js";
import { validate } from "../../core/middleware/validate.js";
import { createProductSchema, updateProductSchema } from "../../shared/validators/product.validator.js";
import {
  getAllProducts,
  getProductsByCategoryId,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductDetail,
  searchProducts,
} from "./product.controller.js";

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

export default productRouter;
