import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const connectionString = process.env.DATABASE_URL;

const client = postgres(connectionString, {
  max: 3,
  idle_timeout: 30,
  prepare: false,
  ssl: "require",
});

export const db = drizzle(client, { schema });
