import Router from "express";
import { isLoggedIn } from "../../core/middleware/isLoggedIn.js";
import { isAdmin } from "../../core/middleware/isAdmin.js";
import { validate } from "../../core/middleware/validate.js";
import { createOrderSchema, updateOrderStatusSchema, updateOrderPaymentSchema } from "../../shared/validators/order.validator.js";
import { createOrder, getUserOrders, getOrder, getAllOrders, updateOrderStatus, updateOrderPaymentStatus } from "./order.controller.js";

const orderRouter = Router();

//-------------------- BUYER ROUTES --------------------//
orderRouter.post("/", validate(createOrderSchema), createOrder); // guests allowed
orderRouter.get("/my-orders", isLoggedIn, getUserOrders);
orderRouter.get("/:id", isLoggedIn, getOrder);

//-------------------- ADMIN ROUTES --------------------//
orderRouter.get("/", isLoggedIn, isAdmin, getAllOrders);
orderRouter.put("/:id/status", isLoggedIn, isAdmin, validate(updateOrderStatusSchema), updateOrderStatus);
orderRouter.put("/:id/payment", isLoggedIn, isAdmin, validate(updateOrderPaymentSchema), updateOrderPaymentStatus);

export default orderRouter;
