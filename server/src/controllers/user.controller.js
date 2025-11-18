import { db } from "../db/index.js";
import { subscriptions, users } from "../db/schema.js";
import bcrypt from "bcryptjs";
import { signToken } from "../config/jwt.js";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();
const isProduction = process.env.NODE_ENV === "production";
// REGISTER
export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Missing fields" });

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existing.length)
      return res.status(409).json({ error: "Email already in use" });

    const password_hash = await bcrypt.hash(password, 10);

    const [created] = await db
      .insert(users)
      .values({ email, name, password_hash })
      .returning();

    const token = signToken({ id: created.id });

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: true, // true in production, false in dev
      sameSite: "none", // optional tweak
      maxAge: 1000 * 60 * 15,
    });

    res.status(201).json({
      user: { id: created.id, email: created.email, name: created.name },
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
      maxAge: 1000 * 60 * 15,
    });

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
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
      .where(eq(users.id, id))
      .limit(1);

    if (!user) return res.status(404).json({ error: "User not found" });
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.user_id, id))
      .limit(1);

    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      subscription: subscription || { status: "Free" },
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
      .limit(1);

    if (!subscription) return res.json({ status: "free" });

    res.json({
      status: subscription.status || "active",
      current_period_end: subscription.current_period_end,
      plan: subscription.plan || null,
    });
  } catch (err) {
    next(err);
  }
};
