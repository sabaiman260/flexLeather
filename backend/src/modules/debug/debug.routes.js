import express from "express";
import { sendTestEmail, emailQueueStatus, emailConnectionTest } from "./debug.controller.js";

const router = express.Router();

// POST /api/v1/debug/test-email  { to }
router.post('/test-email', sendTestEmail);

// GET /api/v1/debug/email-queue
router.get('/email-queue', emailQueueStatus);

// GET /api/v1/debug/email-connection
router.get('/email-connection', emailConnectionTest);

export default router;
