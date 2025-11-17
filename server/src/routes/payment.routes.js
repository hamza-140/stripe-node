import express from "express";
import {
  createPaymentIntent,
  createCheckoutSession,
  verifySession,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create-payment-intent", createPaymentIntent);
router.post("/create-checkout-session", createCheckoutSession);
router.get("/verify-session", verifySession);

export default router;
