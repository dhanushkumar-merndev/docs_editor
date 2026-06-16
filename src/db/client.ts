import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const client = postgres(process.env.DATABASE_URL, {
  max: 1,
  idle_timeout: 5,
  max_lifetime: 60,
  prepare: false,
  ssl: "require",
});

export const db = drizzle(client, { schema });
