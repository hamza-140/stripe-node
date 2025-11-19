import express from "express";
import {
  createPaymentIntent,
  createCheckoutSession,
  verifySession,
  createBillingPortalSession,
  refreshSubscriptionData,
} from "../controllers/payment.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/create-payment-intent", createPaymentIntent);
router.post("/create-checkout-session", createCheckoutSession);
router.get("/verify-session", verifySession);
router.post("/billing-portal", requireAuth, createBillingPortalSession);
router.post("/refresh-subscription", requireAuth, refreshSubscriptionData);

export default router;
