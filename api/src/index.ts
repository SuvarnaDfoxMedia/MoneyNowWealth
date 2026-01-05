

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
import { startTopicScheduler } from "./cron/topicScheduler.js";
// import "./corn/subscriptionCron";
import { startSubscriptionScheduler } from "./cron/subscriptionCron"; 
import userSubscriptionRoutes from "./routes/userSubscriptionRoutes";
import subscriptionPaymentRoutes from "./routes/userSubscriptionPaymentRoutes";
import newsletterRoutes from "./routes/newsletterRoutes";  

dotenv.config();
await connectDatabase();
startTopicScheduler();
startSubscriptionScheduler();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allowed origins
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  process.env.WEBSITE_URL || "http://localhost:3000",
];

// Middleware
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (Postman, curl, server-side)
      if (!origin) return callback(null, true);

      if (!allowedOrigins.includes(origin)) {
        return callback(
          new Error(`CORS policy does not allow access from ${origin}`),
          false
        );
      }

      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);

app.use(cookieParser());
app.use(helmet());

// Static uploads
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), {
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", allowedOrigins.join(", "));
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
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

// Admin route example
app.get(
  "/api/admin",
  protect,
  authorizeRoles("admin"),
  (_req: Request, res: Response) => {
    res.json({ message: "Admin dashboard: Access granted" });
  }
);

// Editor route example
app.get(
  "/api/editor",
  protect,
  authorizeRoles("editor"),
  (_req: Request, res: Response) => {
    res.json({ message: "Editor panel: Access granted" });
  }
);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
