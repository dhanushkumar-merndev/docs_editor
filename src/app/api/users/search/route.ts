import { NextResponse } from "next/server";
import { ilike, or, and, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { requireCurrentUser } from "@/lib/session";
import { searchQuerySchema } from "@/lib/validation";
import { makeRateLimit } from "@/lib/rate-limit";
import { RATE_LIMITS } from "@/lib/limits";

const rateLimit = makeRateLimit(RATE_LIMITS.search.limit, "1 m");

export async function GET(request: Request) {
  const actor = await requireCurrentUser();

  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  if (rateLimit) {
    const { success } = await rateLimit.limit(`search:${ip}`);
    if (!success) return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  const url = new URL(request.url);
  const raw = url.searchParams.get("q") ?? "";
  const parsed = searchQuerySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Query must be 2-80 characters" }, { status: 400 });

  const results = await db
    .select({ id: user.id, name: user.name, email: user.email, image: user.image })
    .from(user)
    .where(
      and(
        ne(user.id, actor.id),
        or(ilike(user.name, `%${parsed.data}%`), ilike(user.email, `%${parsed.data}%`)),
      ),
    )
    .limit(10);

  return NextResponse.json({ users: results });
}
