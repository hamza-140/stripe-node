import { db } from "../db/index.js";
import { subscriptions, users } from "../db/schema.js";
import bcrypt from "bcryptjs";
import { signToken } from "../config/jwt.js";
import { eq, desc } from "drizzle-orm";
import { stripe } from "../config/stripe.js";
import dotenv from "dotenv";

dotenv.config();


export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Missing fields" });

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existing) return res.status(409).json({ error: "Email already exists" });

    const password_hash = await bcrypt.hash(password, 10);

    const [created] = await db
      .insert(users)
      .values({
        email,
        name,
        password_hash,
        stripe_customer_id: stripeCustomerId,
        status: "inactive"
      })
      .returning();

    const token = signToken({ id: created.id });

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.status(201).json({
      user: {
        id: created.id,
        email: created.email,
        name: created.name,
        status: created.status,
        stripe_customer_id: created.stripe_customer_id,
      },
    });
  } catch (err) {
    next(err);
  }
};



export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken({ id: user.id });

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 15 * 60 * 1000,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        stripe_customer_id: user.stripe_customer_id,
      },
    });
  } catch (err) {
    next(err);
  }
};



// GET ME
export const getMe = async (req, res, next) => {
  try {
    const { id } = req.user;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));

    if (!user) return res.status(404).json({ error: "User not found" });

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.user_id, id))
      .orderBy(desc(subscriptions.started_at))
      .limit(1);

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      stripe_customer_id: user.stripe_customer_id,
      subscription: subscription || { status: "free" },
    });
  } catch (err) {
    next(err);
  }
};

// CHANGE PASSWORD
export const changePassword = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword)
      return res.status(400).json({ error: "Missing fields" });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) return res.status(404).json({ error: "User not found" });

    const ok = await bcrypt.compare(oldPassword, user.password_hash || "");
    if (!ok) return res.status(401).json({ error: "Invalid current password" });

    const password_hash = await bcrypt.hash(newPassword, 10);

    await db.update(users).set({ password_hash }).where(eq(users.id, id));

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.cookie("accessToken", "", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      expires: new Date(0),
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const getSubscriptionStatus = async (req, res, next) => {
  try {
    const { id } = req.user;

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.user_id, id))
      .orderBy(desc(subscriptions.started_at))
      .limit(1);

    if (!subscription) return res.json({ status: "free" });

    res.json({
      status: subscription.status,
      plan_id: subscription.plan_id,
      current_period_end: subscription.current_period_end
    });
  } catch (err) {
    next(err);
  }
};
