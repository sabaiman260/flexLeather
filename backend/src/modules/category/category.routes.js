const { Router } = require("express");
const { isLoggedIn } = require("../../core/middleware/isLoggedIn.js");
const { isAdmin } = require("../../core/middleware/isAdmin.js");
const { validate } = require("../../core/middleware/validate.js");
const { createCategorySchema, updateCategorySchema } = require("../../shared/validators/category.validator.js");

const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  searchCategories
} = require("./category.controller.js");

const categoryRouter = Router();

// Public routes
categoryRouter.get("/", getAllCategories);
categoryRouter.get("/search", searchCategories);

// Admin routes
categoryRouter.post("/create", isLoggedIn, isAdmin, validate(createCategorySchema), createCategory);
categoryRouter.put("/:id", isLoggedIn, isAdmin, validate(updateCategorySchema), updateCategory);
categoryRouter.delete("/:id", isLoggedIn, isAdmin, deleteCategory);

module.exports = categoryRouter;
