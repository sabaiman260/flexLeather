// import Router from "express";
// import { upload } from "../../core/middleware/multer.js";
// import { isLoggedIn } from "../../core/middleware/isLoggedIn.js";
// import { isAdmin } from "../../core/middleware/isAdmin.js";
// import { validate } from "../../core/middleware/validate.js";
// import { createVariantSchema, updateVariantSchema } from "../../shared/validators/productVariant.validator.js";
// import { createVariant, getVariants, updateVariant, deleteVariant } from "./productVariant.controller.js";

// const variantRouter = Router();

// //-------------------- PUBLIC ROUTES --------------------//
// variantRouter.get("/", getVariants);

// //-------------------- ADMIN ROUTES --------------------//
// variantRouter.post("/", isLoggedIn, isAdmin, upload.array("images"),validate(createVariantSchema), createVariant);
// variantRouter.put("/:id", isLoggedIn, isAdmin, upload.array("images"),validate(updateVariantSchema), updateVariant);
// variantRouter.delete("/:id", isLoggedIn, isAdmin, deleteVariant);

// export default variantRouter;
