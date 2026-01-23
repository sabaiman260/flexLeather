const { Router } = require("express");
const { isLoggedIn } = require("../../core/middleware/isLoggedIn.js");
const { isAdmin } = require("../../core/middleware/isAdmin.js");
const { validate } = require("../../core/middleware/validate.js");
const { createTransactionSchema } = require("../../shared/validators/transaction.validator.js");
const { createTransaction, getTransactions, getTransaction } = require("./transaction.controller.js");

const transactionRouter = Router();

//-------------------- ADMIN ROUTES --------------------//
transactionRouter.post("/", isLoggedIn, isAdmin, validate(createTransactionSchema), createTransaction);
transactionRouter.get("/", isLoggedIn, isAdmin, getTransactions);
transactionRouter.get("/:id", isLoggedIn, isAdmin, getTransaction);

module.exports = transactionRouter;
