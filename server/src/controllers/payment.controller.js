import { stripe } from "../config/stripe.js";
import { db } from "../db/index.js";
import { users, subscriptions } from "../db/schema.js";
import { eq } from "drizzle-orm";

export const createPaymentIntent = async (req, res, next) => {
  try {
    const { amount } = req.body;

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    next(err);
  }
};

export const createCheckoutSession = async (req, res, next) => {
  try {
    const { items, customer, type, priceId, quantity } = req.body;
    const clientUrl = process.env.CLIENT_URL;
    if (type === "subscription") {
      if (!priceId) return res.status(400).json({ error: "Missing priceId" });

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customer.stripe_customer_id || undefined,
        payment_method_types: ["card", "amazon_pay"],
        line_items: [{ price: priceId, quantity: quantity || 1 }],
        success_url: `${clientUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${clientUrl}/cancel?session_id={CHECKOUT_SESSION_ID}`,
      });

      return res.json({ url: session.url });
    }

    // One-time payments
    if (!items?.length) {
      return res.status(400).json({ error: "No items provided" });
    }

    const line_items = items.map((it) => ({
      price_data: {
        currency: "usd",
        product_data: { name: it.name },
        unit_amount: it.price,
      },
      quantity: it.quantity || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      success_url: `${clientUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/cancel?session_id={CHECKOUT_SESSION_ID}`,
      customer_email: customer?.email,
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
};

export const verifySession = async (req, res, next) => {
  try {
    const session_id = req.query.session_id;

    if (!session_id) {
      return res.status(400).json({ error: "Missing session_id" });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items", "payment_intent", "customer"],
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const email =
      session.customer_email ||
      session.customer_details?.email ||
      session.customer?.email ||
      session.metadata?.customer_email ||
      null;

    res.json({
      valid: session.payment_status === "paid",
      session: {
        customer_email: email,
        amount_total: session.amount_total,
        metadata: session.metadata,
        currency: session.currency,
        line_items: session.line_items?.data || [],
      },
    });
  } catch (err) {
    next(err);
  }
};

export const createBillingPortalSession = async (req, res, next) => {
  try {
    const clientUrl = process.env.CLIENT_URL;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    const stripeCustomerId = user?.stripe_customer_id;
    if (!stripeCustomerId)
      return res.status(400).json({ error: "No Stripe customer id for user" });

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: clientUrl || undefined,
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
};

export const refreshSubscriptionData = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    // Get user's subscription from DB
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user?.stripe_customer_id) {
      return res.status(400).json({ error: "No Stripe customer ID found" });
    }

    // Get latest subscription from Stripe
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: 'all',
      limit: 1
    });

    if (!stripeSubscriptions.data.length) {
      return res.status(404).json({ error: "No subscriptions found" });
    }

    const latestSub = stripeSubscriptions.data[0];
    
    // Convert UNIX -> JS date (same as webhook)
    const toDate = (unix) => (unix ? new Date(unix * 1000) : null);
    
    // Re-process the subscription with fresh mapping
    const mappedSub = {
      stripe_subscription_id: latestSub.id,
      plan_id: latestSub.items?.data?.[0]?.price?.id,
      price_cents: latestSub.items?.data?.[0]?.price?.unit_amount ?? 0,
      currency: latestSub.items?.data?.[0]?.price?.currency || "usd",
      status: latestSub.status || "unknown",
      started_at: toDate(latestSub.start_date || latestSub.created),
      current_period_start: toDate(latestSub.current_period_start),
      current_period_end: toDate(latestSub.current_period_end),
      cancel_at_period_end: Boolean(latestSub.cancel_at_period_end),
      canceled_at: toDate(latestSub.canceled_at),
      metadata: latestSub.metadata || {},
    };
    
    // Update DB with fresh data
    await db.update(subscriptions).set({
      ...mappedSub,
      updated_at: new Date()
    }).where(eq(subscriptions.stripe_subscription_id, latestSub.id));

    res.json({ success: true, subscription: mappedSub });
  } catch (err) {
    next(err);
  }
};
