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
import { cleanupLegacySeoIndexes } from "./db/cleanupLegacySeoIndexes";

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
import "./cron/subscriptionCron";
import userSubscriptionRoutes from "./routes/userSubscriptionRoutes";
import subscriptionPaymentRoutes from "./routes/userSubscriptionPaymentRoutes";
import newsletterRoutes from "./routes/newsletterRoutes";
import { startNewsletterPublishScheduler } from "./cron/newsletterPublishCron";
import { startMfNfoScheduler } from "./cron/mfNfoCron";
import newsletterPublishRoutes from "./routes/newsletterPublishRoutes";
import mfRoutes from "./routes/mfRoutes";
import mfApiRoutes from "./routes/mfApiRoutes";
import financialAssessmentRoutes from "./routes/financialAssessmentRoutes";
import partnerEnquiryRoutes from "./routes/partnerEnquiryRoutes";
import oneCroreJourneyEnquiryRoutes from "./routes/oneCroreJourneyEnquiryRoutes";
import whoWeWorkWithEnquiryRoutes from "./routes/whoWeWorkWithEnquiryRoutes";
import enquiryUnreadRoutes from "./routes/enquiryUnreadRoutes";
import seoRoutes from "./routes/seoRoutes";
import navRoutes from "./routes/navRoutes";
import testimonialRoutes from "./routes/testimonialRoutes";
import { validateEmailEnvironment } from "./config/emailEnv";
// Chatbot integration is temporarily disabled for lead review; keep code commented instead of deleting it.
// import chatRoutes from "./routes/chatbot/chatRoutes";
// import { getGeminiApiKeyStatus } from "./controllers/chatbot/chatController.js";

dotenv.config();
validateEmailEnvironment();
await connectDatabase();
await cleanupLegacyMfIndexes();
await cleanupLegacySeoIndexes();
startNewsletterPublishScheduler();
startMfNfoScheduler();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  process.env.WEBSITE_URL,
]
  .flatMap((value) => String(value || "").split(","))
  .map((origin) => origin.trim())
  .filter(Boolean)
  .concat([
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5000",
  ]);

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
    // Chatbot integration is temporarily disabled for lead review; keep rate-limit dependency commented instead of deleting it.
    // path.startsWith("/api/chat") ||
    path === "/api/newsletter" ||
    path === "/api/contact-enquiries" ||
    path === "/api/partner-enquiries" ||
    path === "/api/one-crore-journey-enquiries" ||
    path === "/api/who-we-work-with-enquiries";

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
app.use("/api", mfApiRoutes);
app.use("/api", financialAssessmentRoutes);
app.use("/api", partnerEnquiryRoutes);
app.use("/api", oneCroreJourneyEnquiryRoutes);
app.use("/api", whoWeWorkWithEnquiryRoutes);
app.use("/api", enquiryUnreadRoutes);
app.use("/api", seoRoutes);
app.use("/api", navRoutes);
app.use("/api/testimonials", testimonialRoutes);
// Chatbot integration is temporarily disabled for lead review; keep route mount commented instead of deleting it.
// app.use("/api/chat", chatRoutes);

app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Money Now backend is running.",
  });
});

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

app.get("/api/health", (_req: Request, res: Response) => {
  // Chatbot integration is temporarily disabled for lead review; keep Gemini health dependency commented instead of deleting it.
  // const apiKeyStatus = getGeminiApiKeyStatus();

  res.json({
    success: true,
    service: "money-now-backend",
    // geminiConfigured: apiKeyStatus.valid,
    // geminiConfigError: apiKeyStatus.valid ? null : apiKeyStatus.error,
    // geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
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

app.use(
  (error: any, _req: Request, res: Response, _next: express.NextFunction) => {
    const status = Number(error?.statusCode) || 500;
    return res.status(status).json({
      success: false,
      message: error?.message || "Internal server error",
      data: null,
    });
  },
);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
