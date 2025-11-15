import express from "express";
import cors from "cors";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const PORT = process.env.PORT || 5000;

app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount } = req.body; 

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true }
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items, customer } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }

    const line_items = items.map((it) => ({
      price_data: {
        currency: 'usd',
        product_data: { name: it.name },
        unit_amount: it.price 
      },
      quantity: it.quantity || 1
    }));

    const clientUrl = process.env.CLIENT_URL;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      success_url: `${clientUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/cancel?session_id={CHECKOUT_SESSION_ID}`,
      customer_email: customer?.email,
      metadata: {
        customer_name: customer?.name || '',
        customer_phone: customer?.phone || ''
      }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.log('Checkout session error', err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/verify-session", async (req, res) => {
  try {
    const session_id = req.query.session_id;

    if (!session_id) {
      return res.status(400).json({ error: "Missing session_id" });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items", "payment_intent"],
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const paid = session.payment_status === "paid";

    res.json({
      valid: paid,
      session: {
        customer_email: session.customer_email,
        metadata: session.metadata,
        amount_total: session.amount_total,
        currency: session.currency,
        line_items: session.line_items?.data || []
      },
    });
  } catch (err) {
    console.log("Verification Error:", err);
    res.status(500).json({ error: err.message });
  }
});



app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
