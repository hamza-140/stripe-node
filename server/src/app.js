import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import paymentRoutes from "./routes/payment.routes.js";
import userRoutes from "./routes/user.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import webhookRoute from "./routes/webhook.routes.js";

const app = express();

// 🔥 IMPORTANT: Replace with your real frontend URL
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true, // REQUIRED for cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 🔥 1. Cookie Parser (runs before routes)
app.use(cookieParser());

// 🔥 2. STRIPE WEBHOOK ROUTE (MUST come before express.json)
// The raw body is needed for Stripe signature verification.
app.use("/webhook", webhookRoute);

// 🔥 3. BODY PARSERS (for all other routes)
app.use(express.json({ limit: "16kb" })); // Set a reasonable limit
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// 4. API ROUTES
app.use("/", paymentRoutes);
app.use("/users", userRoutes);

// Basic Health Check Route
app.get("/", (req, res) => {
  res.status(200).send("Stripe Payment Server is running");
});

// 5. ERROR HANDLER (Last middleware)
app.use(errorHandler);

export default app;