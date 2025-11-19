import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import paymentRoutes from "./routes/payment.routes.js";
import userRoutes from "./routes/user.routes.js";
import webhookRoute from "./routes/webhook.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

// ----------------------
// CORS
// ----------------------
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const allowedOrigins = (process.env.ALLOWED_ORIGINS || FRONTEND_URL)
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.set("trust proxy", 1);

// ----------------------
// Cookies + Webhook
// ----------------------
app.use(cookieParser());

// Stripe webhook needs raw body — keep before JSON parser
app.use("/webhook", webhookRoute);

// ----------------------
// Parsers
// ----------------------
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// ----------------------
// Routes
// ----------------------
app.use("/", paymentRoutes);
app.use("/users", userRoutes);

// Health check
app.get("/", (req, res) => res.send("Stripe Payment Server is running"));

// ----------------------
// Error Handler
// ----------------------
app.use(errorHandler);

export default app;
