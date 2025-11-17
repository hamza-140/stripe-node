import express from "express";
import cors from "cors";
import paymentRoutes from "./routes/payment.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", paymentRoutes);

app.get("/", (req, res) => {
  res.send("Stripe Payment Server is running");
});

app.use(errorHandler);

export default app;
