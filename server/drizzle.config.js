import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config(); 
export default defineConfig({
  dialect: "postgresql",            // ⭐ REQUIRED
  schema: "./src/db/schema.js",
  out: "./drizzle",

  dbCredentials: {
    url: process.env.DATABASE_URL, // ⭐ use "url" (new format)
  },
});
