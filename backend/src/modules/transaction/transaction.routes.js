import Router from "express";
import { isLoggedIn } from "../../core/middleware/isLoggedIn.js";
import { isAdmin } from "../../core/middleware/isAdmin.js";
import { validate } from "../../core/middleware/validate.js";
import { createTransactionSchema } from "../../shared/validators/transaction.validator.js";
import { createTransaction, getTransactions, getTransaction } from "./transaction.controller.js";

const transactionRouter = Router();

//-------------------- ADMIN ROUTES --------------------//
transactionRouter.post("/", isLoggedIn, isAdmin, validate(createTransactionSchema), createTransaction);
transactionRouter.get("/", isLoggedIn, isAdmin, getTransactions);
transactionRouter.get("/:id", isLoggedIn, isAdmin, getTransaction);

export default transactionRouter;
