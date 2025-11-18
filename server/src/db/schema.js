import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

// USERS
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  password_hash: text("password_hash").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// SUBSCRIPTIONS (recurring)
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),

  stripe_subscription_id: varchar("stripe_subscription_id", { length: 255 }),
  plan_id: varchar("plan_id", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),

  price_cents: integer("price_cents").notNull(),
  currency: varchar("currency", { length: 10 }).default("usd"),

  started_at: timestamp("started_at").defaultNow().notNull(),
  current_period_start: timestamp("current_period_start"),
  current_period_end: timestamp("current_period_end"),

  cancel_at_period_end: boolean("cancel_at_period_end").default(false),
  canceled_at: timestamp("canceled_at"),
  metadata: jsonb("metadata").default({}),

  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ONE-TIME PURCHASES
export const one_time_purchases = pgTable("one_time_purchases", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),

  product_id: varchar("product_id", { length: 255 }).notNull(),
  amount_cents: integer("amount_cents").notNull(),
  currency: varchar("currency", { length: 10 }).default("usd"),

  payment_provider: varchar("payment_provider", { length: 50 }),
  payment_reference: varchar("payment_reference", { length: 255 }),

  purchased_at: timestamp("purchased_at").defaultNow().notNull(),
  metadata: jsonb("metadata").default({}),
});
