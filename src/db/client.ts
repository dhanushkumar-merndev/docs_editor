import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const url = new URL(process.env.DATABASE_URL);
const client = postgres({
  host: url.hostname,
  port: Number(url.port),
  database: url.pathname.slice(1),
  username: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  max: 3,
  idle_timeout: 30,
  prepare: false,
  ssl: "require",
});

export const db = drizzle(client, { schema });
