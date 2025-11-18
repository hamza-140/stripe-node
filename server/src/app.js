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
    credentials: true, // 🔥 REQUIRED for cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 🔥 Must be above routes
app.use(cookieParser());

app.use("/webhook", webhookRoute);

app.use(express.json());

app.use("/", paymentRoutes);
app.use("/users", userRoutes);

app.get("/", (req, res) => {
  res.send("Stripe Payment Server is running");
});

app.use(errorHandler);

export default app;
