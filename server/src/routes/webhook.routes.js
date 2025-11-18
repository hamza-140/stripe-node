import express from "express";
import { stripe } from "../config/stripe.js";

const router = express.Router();

router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case "checkout.session.completed":
        console.log("✔️ Checkout completed:", event.data.object.id);
        break;

      case "customer.subscription.created":
        console.log("✔️ Subscription created:", event.data.object.id);
        break;

      case "customer.subscription.updated":
        console.log("🔄 Subscription updated:", event.data.object.id);
        break;

      case "customer.subscription.deleted":
        console.log("❌ Subscription canceled:", event.data.object.id);
        break;

      case "invoice.paid":
        console.log("💰 Invoice paid:", event.data.object.id);
        break;

      case "invoice.payment_failed":
        console.log("⚠️ Invoice payment failed:", event.data.object.id);
        break;

      default:
        console.log("ℹ️ Unhandled event:", event.type);
    }

    res.json({ received: true });
  }
);

export default router;
