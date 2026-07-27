
import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";

import { errorHandler } from "./src/core/middleware/errorHandler.js";

import authRouter from "./src/modules/auth/auth.route.js";
import productRouter from "./src/modules/product/product.routes.js";
import categoryRouter from "./src/modules/category/category.routes.js";
import reviewRouter from "./src/modules/reviews/review.routes.js";
import orderRouter from "./src/modules/order/order.routes.js";
import paymentRouter from "./src/modules/payment/payment.routes.js";
import transactionRouter from "./src/modules/transaction/transaction.routes.js";
import adminRouter from "./src/modules/admin/admin.routes.js";
import cloudinaryRouter from "./src/modules/cloudinary/cloudinary.route.js";
import settingsRouter from "./src/modules/settings/settings.routes.js";
import bannerRouter from "./src/modules/banner/banner.routes.js";

const app = express();

/* =======================
   CORS
   Dev:  any localhost origin is allowed
   Prod: only domains listed in CORS_ORIGINS env var (comma-separated)
         e.g. CORS_ORIGINS=https://theflexleather.com,https://www.theflexleather.com
======================= */
const prodOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server (no origin header) and health checks
      if (!origin) return callback(null, true);

      if (process.env.NODE_ENV !== "production") {
        // Development: allow all localhost / local IPs
        if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
          return callback(null, true);
        }
      }

      if (prodOrigins.includes(origin)) return callback(null, true);

      return callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* =======================
   CORE MIDDLEWARE
======================= */
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* =======================
   ROUTES
======================= */
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/transactions", transactionRouter);
app.use("/api/v1/admin", adminRouter);
app.use('/api/v1/cloudinary', cloudinaryRouter);
app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1/banners', bannerRouter);

/* =======================
   HEALTH CHECK                                 paste link in browser :   https://server.theflexleather.com/health
======================= */
app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, timestamp: new Date().toISOString() });
});

/* =======================
   ERROR HANDLER
======================= */
app.use(errorHandler);

export default app;
