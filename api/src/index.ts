// src/server.ts

// import express, { Request, Response } from "express";
// import dotenv from "dotenv";
// import path from "path";
// import { fileURLToPath } from "url";
// import helmet from "helmet";
// import cors from "cors";
// import cookieParser from "cookie-parser";

// // Database
// import connectDatabase from "./db/dbConnection";

// // Routes
// import authRoutes from "./routes/authRoutes";
// import profileRoutes from "./routes/profileRoutes";
// import contactEnquiryRoutes from "./routes/contactEnquiryRoutes";
// import clusterRoutes from "./routes/clusterRoutes";
// import cmsPageRoutes from "./routes/cmsPageRoutes";
// import topicRoutes from "./routes/topicRoutes";
// import articleRoutes from "./routes/articleRoutes";
// import subscriptionPlanRoutes from "./routes/subscriptionPlanRoutes";
// import uploadRoutes from "./routes/uploadRoutes";
// import { protect, authorizeRoles } from "./middlewares/authMiddleware";
// import { startTopicScheduler } from "./cron/topicScheduler";
// // import "./corn/subscriptionCron";
// import { startSubscriptionScheduler } from "./cron/subscriptionCron";
// import userSubscriptionRoutes from "./routes/userSubscriptionRoutes";
// import subscriptionPaymentRoutes from "./routes/userSubscriptionPaymentRoutes";
// import newsletterRoutes from "./routes/newsletterRoutes";
// import { startNewsletterPublishScheduler } from "./cron/newsletterPublishCron";
// import newsletterPublishRoutes from "./routes/newsletterPublishRoutes";

// dotenv.config();
// await connectDatabase();
// startTopicScheduler();
// startSubscriptionScheduler();
// startNewsletterPublishScheduler();

// const app = express();
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Allowed origins
// const allowedOrigins = [
//   process.env.FRONTEND_URL,
//   process.env.WEBSITE_URL,
// ].filter(Boolean);

// // Middleware
// app.use(express.json({ limit: "100mb" }));
// app.use(express.urlencoded({ limit: "100mb", extended: true }));

// app.use(
//   cors({
//     // origin: ['http://145.223.20.173:3000', 'http://145.223.20.173:4000'],
//     origin: [
//       "http://localhost:5000",
//       "http://localhost:5173",
//       "http://localhost:3000",
//     ],
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   }),
// );

// app.use(cookieParser());
// app.use(helmet());

// // Static uploads
// app.use(
//   "/uploads",
//   express.static(path.join(process.cwd(), "uploads"), {
//     setHeaders: (res) => {
//       res.setHeader("Access-Control-Allow-Origin", allowedOrigins.join(", "));
//       res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
//     },
//   }),
// );

// // API Routes
// app.use("/api/auth", authRoutes);
// app.use("/api", profileRoutes);
// app.use("/api", clusterRoutes);
// app.use("/api", topicRoutes);
// app.use("/api", articleRoutes);
// app.use("/api", cmsPageRoutes);
// app.use("/api", contactEnquiryRoutes);
// app.use("/api", subscriptionPlanRoutes);
// app.use("/api", userSubscriptionRoutes);
// app.use("/api", subscriptionPaymentRoutes);
// app.use("/api", uploadRoutes);
// app.use("/api", newsletterRoutes);

// app.use("/api", newsletterPublishRoutes);

// // Admin route example
// app.get(
//   "/api/admin",
//   protect,
//   authorizeRoles("admin"),
//   (_req: Request, res: Response) => {
//     res.json({ message: "Admin dashboard: Access granted" });
//   },
// );

// // Editor route example
// app.get(
//   "/api/editor",
//   protect,
//   authorizeRoles("editor"),
//   (_req: Request, res: Response) => {
//     res.json({ message: "Editor panel: Access granted" });
//   },
// );

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// src/server.ts

import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";

// Database
import connectDatabase from "./db/dbConnection";
import { cleanupLegacyMfIndexes } from "./db/cleanupLegacyMfIndexes";

// Routes
import authRoutes from "./routes/authRoutes";
import profileRoutes from "./routes/profileRoutes";
import contactEnquiryRoutes from "./routes/contactEnquiryRoutes";
import clusterRoutes from "./routes/clusterRoutes";
import cmsPageRoutes from "./routes/cmsPageRoutes";
import topicRoutes from "./routes/topicRoutes";
import articleRoutes from "./routes/articleRoutes";
import subscriptionPlanRoutes from "./routes/subscriptionPlanRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import { protect, authorizeRoles } from "./middlewares/authMiddleware";
import { startTopicScheduler } from "./cron/topicScheduler";
import { startSubscriptionScheduler } from "./cron/subscriptionCron";
import userSubscriptionRoutes from "./routes/userSubscriptionRoutes";
import subscriptionPaymentRoutes from "./routes/userSubscriptionPaymentRoutes";
import newsletterRoutes from "./routes/newsletterRoutes";
import { startNewsletterPublishScheduler } from "./cron/newsletterPublishCron";
import newsletterPublishRoutes from "./routes/newsletterPublishRoutes";
import mfRoutes from "./routes/mfRoutes";

dotenv.config();
await connectDatabase();
await cleanupLegacyMfIndexes();
startTopicScheduler();
startSubscriptionScheduler();
startNewsletterPublishScheduler();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// CORS: environment-driven allowlist with safe localhost fallbacks for dev.
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  process.env.WEBSITE_URL,
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5000",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "Range"],
    exposedHeaders: [
      "Content-Range",
      "Content-Disposition",
      "Content-Length",
      "Accept-Ranges",
      "Content-Type",
    ],
    maxAge: 86400, // 24 hours for preflight cache
  }),
);

app.use(cookieParser());
app.use(helmet());

// Basic in-memory rate limiter for auth-sensitive/public endpoints.
// Replace with Redis-backed limiter for multi-instance production.
const requestBuckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const MAX_REQ = Number(process.env.RATE_LIMIT_MAX || 120);
app.use((req, res, next) => {
  // Limit only auth/public-sensitive endpoints to avoid blocking admin CRUD UX.
  const path = req.path || "";
  const shouldRateLimit =
    path.startsWith("/api/auth") ||
    path === "/api/newsletter" ||
    path === "/api/contact-enquiries";

  if (!shouldRateLimit) {
    return next();
  }

  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  const current = requestBuckets.get(key);

  if (!current || now > current.resetAt) {
    requestBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (current.count >= MAX_REQ) {
    return res.status(429).json({
      success: false,
      message: "Too many requests. Please try again shortly.",
      data: null,
    });
  }

  current.count += 1;
  requestBuckets.set(key, current);
  return next();
});

// FIXED: Static uploads with proper CORS headers
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), {
    setHeaders: (res, path) => {
      // Don't override CORS headers if they're already set
      if (!res.getHeader("Access-Control-Allow-Origin")) {
        // Allow all origins for static files (or you can be more restrictive)
        res.setHeader("Access-Control-Allow-Origin", "*");
      }

      // Set Cross-Origin headers for images
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

      // Set cache control for images
      if (path.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
        res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year cache for images
      }

      // For PDF files
      if (path.match(/\.pdf$/)) {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline");
      }
    },
  }),
);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api", profileRoutes);
app.use("/api", clusterRoutes);
app.use("/api", topicRoutes);
app.use("/api", articleRoutes);
app.use("/api", cmsPageRoutes);
app.use("/api", contactEnquiryRoutes);
app.use("/api", subscriptionPlanRoutes);
app.use("/api", userSubscriptionRoutes);
app.use("/api", subscriptionPaymentRoutes);
app.use("/api", uploadRoutes);
app.use("/api", newsletterRoutes);
app.use("/api", newsletterPublishRoutes);
app.use("/api", mfRoutes);

// Admin route example
app.get(
  "/api/admin",
  protect,
  authorizeRoles("admin"),
  (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: "Admin dashboard: Access granted",
      data: null,
    });
  },
);

// Editor route example
app.get(
  "/api/editor",
  protect,
  authorizeRoles("editor"),
  (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: "Editor panel: Access granted",
      data: null,
    });
  },
);

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "OK",
    data: { status: "OK", timestamp: new Date().toISOString() },
  });
});

app.use((_req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
    data: null,
  });
});

app.use((error: any, _req: Request, res: Response, _next: express.NextFunction) => {
  const status = Number(error?.statusCode) || 500;
  return res.status(status).json({
    success: false,
    message: error?.message || "Internal server error",
    data: null,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

