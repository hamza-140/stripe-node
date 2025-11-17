import { stripe } from "../config/stripe.js";

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
        payment_method_types: ["card", "amazon_pay"],
        line_items: [{ price: priceId, quantity: quantity || 1 }],
        success_url: `${clientUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${clientUrl}/cancel?session_id={CHECKOUT_SESSION_ID}`,
        customer_email: customer?.email,
        metadata: {
          customer_name: customer?.name || "",
          customer_phone: customer?.phone || "",
          customer_email: customer?.email || "",
        },
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
