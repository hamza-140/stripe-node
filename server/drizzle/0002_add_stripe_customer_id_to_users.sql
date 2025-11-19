-- Add stripe_customer_id column and unique index to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_customer_id" varchar(255);
CREATE UNIQUE INDEX IF NOT EXISTS "users_stripe_customer_id_unique" ON "users" ("stripe_customer_id") WHERE stripe_customer_id IS NOT NULL;