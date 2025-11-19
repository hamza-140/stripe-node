import express from "express";
import { stripe } from "../config/stripe.js";
import { db } from "../db/index.js";
import { users, subscriptions } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = express.Router();

const toDate = (unix) => (unix ? new Date(unix * 1000) : null);

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
      return res.status(400).send(`Webhook error: ${err.message}`);
    }

    const data = event.data.object;

    console.log("\n====================================");
    console.log("🔔 EVENT:", event.type);
    console.log("====================================\n");

    /* ============================================================================
       SWITCH HANDLERS
    ============================================================================ */
    switch (event.type) {
      /* -------------------------------------------------------------------------
         1️⃣ CHECKOUT SESSION COMPLETED → SAVE STRIPE CUSTOMER ID
      -------------------------------------------------------------------------- */
      case "checkout.session.completed": {
        console.log("👉 checkout.session.completed");

        const email =
          data.customer_details?.email ||
          data.customer_email ||
          null;

        if (!email) {
          console.log("⚠️ No email found in session.");
          break;
        }

        const customerId = data.customer;

        // find user
        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user) {
          console.log("⚠️ No user found for email:", email);
          break;
        }

        await db
          .update(users)
          .set({
            stripe_customer_id: customerId,
            updated_at: new Date(),
          })
          .where(eq(users.id, user.id));

        console.log("💾 Linked customer → user:", email);
        break;
      }

      /* -------------------------------------------------------------------------
         2️⃣ SUBSCRIPTION CREATED → INSERT INTO subscriptions
      -------------------------------------------------------------------------- */
      case "customer.subscription.created": {
        console.log("👉 subscription.created");

        const customerId = data.customer;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.stripe_customer_id, customerId));

        if (!user) {
          console.log("⚠️ No user for subscription.");
          break;
        }

        const price = data.items.data[0].price;

        await db.insert(subscriptions).values({
          user_id: user.id,
          stripe_subscription_id: data.id,
          plan_id: price.id,
          status: data.status,
          price_cents: price.unit_amount,
          currency: price.currency || "usd",

          started_at: toDate(data.start_date),
          current_period_start: toDate(data.start_date),
          current_period_end: null,

          cancel_at_period_end: data.cancel_at_period_end,
          canceled_at: toDate(data.canceled_at),

          metadata: data.metadata || {},

          created_at: new Date(),
          updated_at: new Date(),
        });

        // sync user
        await db
          .update(users)
          .set({ status: data.status, updated_at: new Date() })
          .where(eq(users.id, user.id));

        console.log("💾 Subscription created & user updated");
        break;
      }

      /* -------------------------------------------------------------------------
         3️⃣ SUBSCRIPTION UPDATED
      -------------------------------------------------------------------------- */
      case "customer.subscription.updated": {
        console.log("👉 subscription.updated");

        const price = data.items.data[0].price;

        await db
          .update(subscriptions)
          .set({
            status: data.status,
            plan_id: price.id,
            price_cents: price.unit_amount,
            currency: price.currency,

            current_period_start: toDate(data.current_period_start),
            current_period_end: toDate(data.current_period_end),

            cancel_at_period_end: data.cancel_at_period_end,
            canceled_at: toDate(data.canceled_at),

            updated_at: new Date(),
          })
          .where(eq(subscriptions.stripe_subscription_id, data.id));

        console.log("💾 Subscription updated");
        break;
      }

      /* -------------------------------------------------------------------------
         4️⃣ SUBSCRIPTION DELETED → CANCEL
      -------------------------------------------------------------------------- */
      case "customer.subscription.deleted": {
        console.log("👉 subscription.deleted");

        await db
          .update(subscriptions)
          .set({
            status: "canceled",
            canceled_at: new Date(),
            updated_at: new Date(),
          })
          .where(eq(subscriptions.stripe_subscription_id, data.id));

        // find owning user
        const [sub] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripe_subscription_id, data.id));

        if (sub) {
          await db
            .update(users)
            .set({ status: "inactive", updated_at: new Date() })
            .where(eq(users.id, sub.user_id));
        }

        console.log("💾 Subscription canceled & user deactivated");
        break;
      }

      /* -------------------------------------------------------------------------
         5️⃣ INVOICE PAID → RENEWAL ()
      -------------------------------------------------------------------------- */
      case "invoice.paid": {
        console.log("👉 invoice.paid");
        // console.log("Invoice paid with data:", data);

        const subscriptionId = data.parent?.subscription_details?.subscription
          || data.subscription; // safety

        if (!subscriptionId) break;

        const line = data.lines.data[0];

        await db
          .update(subscriptions)
          .set({
            status: "active",
            current_period_start: toDate(data.period_start),
            current_period_end: toDate(data.period_end),
            updated_at: new Date(),
          })
          .where(eq(subscriptions.stripe_subscription_id, subscriptionId));

        // update user
        const [sub] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripe_subscription_id, subscriptionId));

        if (sub) {
          await db
            .update(users)
            .set({ status: "active", updated_at: new Date() })
            .where(eq(users.id, sub.user_id));
        }

        console.log("💾 Subscription renewed & user active");
        break;
      }

      /* -------------------------------------------------------------------------
         6️⃣ PAYMENT FAILED → PAST DUE
      -------------------------------------------------------------------------- */
      case "invoice.payment_failed": {
        console.log("👉 invoice.payment_failed");

        const subscriptionId = data.subscription;
        if (!subscriptionId) break;

        await db
          .update(subscriptions)
          .set({
            status: "past_due",
            updated_at: new Date(),
          })
          .where(eq(subscriptions.stripe_subscription_id, subscriptionId));

        const [sub] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripe_subscription_id, subscriptionId));

        if (sub) {
          await db
            .update(users)
            .set({
              status: "past_due",
              updated_at: new Date(),
            })
            .where(eq(users.id, sub.user_id));
        }

        console.log("💾 Subscription & user marked past_due");
        break;
      }

      /* -------------------------------------------------------------------------
         DEFAULT
      -------------------------------------------------------------------------- */
      default:
        console.log("No handler for this event type:", event.type);
    }

    return res.sendStatus(200);
  }
);

export default router;
