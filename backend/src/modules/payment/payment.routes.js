const { Router } = require("express");
const { isLoggedIn } = require("../../core/middleware/isLoggedIn.js");
const { isAdmin } = require("../../core/middleware/isAdmin.js");
const { validate } = require("../../core/middleware/validate.js");
const { createPaymentSchema, updatePaymentStatusSchema, submitManualPaymentSchema } = require("../../shared/validators/payment.validator.js");
const { createPayment, updatePaymentStatus, getPayment, gatewayWebhook, submitManualPayment, getPaymentInstructions } = require("./payment.controller.js");

const paymentRouter = Router();

//-------------------- USER ROUTES --------------------//
paymentRouter.post("/", validate(createPaymentSchema), createPayment);
// Submit a manual transaction/reference ID for verification
paymentRouter.post("/manual", validate(submitManualPaymentSchema), submitManualPayment);
// Retrieve manual payment instructions (merchant account numbers etc.)
paymentRouter.get("/instructions", getPaymentInstructions);
paymentRouter.get("/:id", isLoggedIn, getPayment);

//-------------------- ADMIN ROUTES --------------------//
paymentRouter.put("/:id/status", isLoggedIn, isAdmin, validate(updatePaymentStatusSchema), updatePaymentStatus);

//-------------------- GATEWAY WEBHOOK --------------------//
paymentRouter.post("/webhook/:provider", gatewayWebhook);

module.exports = paymentRouter;
