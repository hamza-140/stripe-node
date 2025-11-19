-- Add unique index required for ON CONFLICT on stripe_subscription_id
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_stripe_subscription_id_unique"
ON "subscriptions" ("stripe_subscription_id");
