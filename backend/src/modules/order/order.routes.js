const { Router } = require("express");
const { isLoggedIn, optionalAuth } = require("../../core/middleware/isLoggedIn.js");
const { isAdmin } = require("../../core/middleware/isAdmin.js");
const { validate } = require("../../core/middleware/validate.js");
const { createOrderSchema, updateOrderStatusSchema, updateOrderPaymentSchema } = require("../../shared/validators/order.validator.js");
const { createOrder, getUserOrders, getEligibleOrdersForReview, getOrder, getAllOrders, updateOrderStatus, updateOrderPaymentStatus } = require("./order.controller.js");

const orderRouter = Router();

//-------------------- BUYER ROUTES --------------------//
orderRouter.post("/", optionalAuth, validate(createOrderSchema), createOrder); // supports both logged-in users and guests
orderRouter.get("/my-orders", isLoggedIn, getUserOrders);
orderRouter.get("/eligible-for-review/:productId", isLoggedIn, getEligibleOrdersForReview);
orderRouter.get("/:id", isLoggedIn, getOrder);

//-------------------- ADMIN ROUTES --------------------//
orderRouter.get("/", isLoggedIn, isAdmin, getAllOrders);
orderRouter.put("/:id/status", isLoggedIn, isAdmin, validate(updateOrderStatusSchema), updateOrderStatus);
orderRouter.put("/:id/payment", isLoggedIn, isAdmin, validate(updateOrderPaymentSchema), updateOrderPaymentStatus);

module.exports = orderRouter;
