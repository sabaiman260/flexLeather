// import { asyncHandler } from "../../core/utils/async-handler.js";
// import ProductVariant from "../../models/ProductVariant.model.js";
// import Product from "../../models/Product.model.js";
// import { ApiError } from "../../core/utils/api-error.js";
// import { ApiResponse } from "../../core/utils/api-response.js";
// import S3UploadHelper from "../../shared/helpers/s3Upload.js";

// //-------------------- CREATE VARIANT --------------------//
// const createVariant = asyncHandler(async (req, res) => {
//     const { product, name, price, stock, sku } = req.body;

//     const productExists = await Product.findById(product);
//     if (!productExists) throw new ApiError(400, "Product not found");

//     let images = [];
//     if (req.files) {
//         for (let file of req.files) {
//             const uploadResult = await S3UploadHelper.uploadFile(file, "variants");
//             images.push(uploadResult.key);
//         }
//     }

//     const variant = await ProductVariant.create({ product, name, price, stock, sku, images });
//     productExists.variants.push(variant._id);
//     await productExists.save();

//     return res.status(201).json(new ApiResponse(201, variant, "Product variant created successfully"));
// });

// //-------------------- GET VARIANTS --------------------//
// const getVariants = asyncHandler(async (req, res) => {
//     const variants = await ProductVariant.find().populate("product");
//     return res.status(200).json(new ApiResponse(200, variants, "Variants fetched successfully"));
// });

// //-------------------- UPDATE VARIANT --------------------//
// const updateVariant = asyncHandler(async (req, res) => {
//     const variant = await ProductVariant.findById(req.params.id);
//     if (!variant) throw new ApiError(404, "Variant not found");

//     const { name, price, stock, sku } = req.body;
//     variant.name = name || variant.name;
//     variant.price = price || variant.price;
//     variant.stock = stock || variant.stock;
//     variant.sku = sku || variant.sku;

//     if (req.files) {
//         let images = [];
//         for (let file of req.files) {
//             const uploadResult = await S3UploadHelper.uploadFile(file, "variants");
//             images.push(uploadResult.key);
//         }
//         variant.images = images;
//     }

//     await variant.save();
//     return res.status(200).json(new ApiResponse(200, variant, "Variant updated successfully"));
// });

// //-------------------- DELETE VARIANT --------------------//
// const deleteVariant = asyncHandler(async (req, res) => {
//     const variant = await ProductVariant.findById(req.params.id);
//     if (!variant) throw new ApiError(404, "Variant not found");

//     const product = await Product.findById(variant.product);
//     if (product) {
//         product.variants.pull(variant._id);
//         await product.save();
//     }

//     await variant.remove();
//     return res.status(200).json(new ApiResponse(200, {}, "Variant deleted successfully"));
// });

// export { createVariant, getVariants, updateVariant, deleteVariant };
