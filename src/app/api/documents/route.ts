import { NextResponse } from "next/server";
import { createDocumentForUser, listAccessibleDocuments, searchDocumentsForUser } from "@/lib/document-service";
import { requireCurrentUser } from "@/lib/session";
import { searchQuerySchema, titleSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const actor = await requireCurrentUser();
  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  if (query && query.trim().length >= 2) {
    const parsed = searchQuerySchema.safeParse(query);
    if (!parsed.success) return NextResponse.json({ error: "Invalid search query" }, { status: 400 });
    return NextResponse.json({ documents: await searchDocumentsForUser(actor, parsed.data) });
  }
  return NextResponse.json({ documents: await listAccessibleDocuments(actor) });
}

export async function POST(request: Request) {
  const actor = await requireCurrentUser();
  const body = (await request.json()) as { title?: string };
  const parsed = titleSchema.safeParse(body.title ?? "Untitled Document");
  if (!parsed.success) return NextResponse.json({ error: "Invalid title" }, { status: 400 });
  const documentId = await createDocumentForUser(actor, parsed.data);
  return NextResponse.json({ documentId });
}
