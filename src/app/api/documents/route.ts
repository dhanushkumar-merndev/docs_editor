import { NextResponse } from "next/server";
import { createDocumentForUser, listAccessibleDocuments, searchDocumentsForUser } from "@/lib/document-service";
import { requireCurrentUser } from "@/lib/session";
import { searchQuerySchema, titleSchema, tiptapDocSchema, markdownContentSchema } from "@/lib/validation";
import type { TiptapDoc, MarkdownDoc } from "@/lib/types";

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
  const body = (await request.json()) as { title?: string; content?: TiptapDoc | MarkdownDoc; imported?: boolean };
  const parsed = titleSchema.safeParse(body.title ?? "Untitled Document");
  if (!parsed.success) return NextResponse.json({ error: "Invalid title" }, { status: 400 });
  let validatedContent: TiptapDoc | MarkdownDoc | undefined;
  if (body.content) {
    const isMarkdown = "format" in body.content && body.content.format === "markdown";
    const result = isMarkdown
      ? markdownContentSchema.safeParse(body.content)
      : tiptapDocSchema.safeParse(body.content);
    if (!result.success) return NextResponse.json({ error: "Invalid document content" }, { status: 400 });
    validatedContent = result.data as TiptapDoc | MarkdownDoc;
  }
  const documentId = await createDocumentForUser(actor, parsed.data, validatedContent, Boolean(body.imported));
  return NextResponse.json({ documentId });
}
