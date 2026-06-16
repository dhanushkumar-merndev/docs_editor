import { NextResponse } from "next/server";
import {
  createPublicEditorLink,
  deleteDocumentForOwner,
  getDocumentForUser,
  leaveSharedDocument,
  renameDocumentForUser,
  saveDocumentContent,
  shareDocumentByEmail,
  updatePageCountForUser,
  updatePageSizeForUser,
} from "@/lib/document-service";
import { requireCurrentUser } from "@/lib/session";
import { emailSchema, pageSizeSchema, shareRoleSchema, tiptapDocSchema, titleSchema } from "@/lib/validation";
import type { TiptapDoc } from "@/lib/types";

export async function GET(_request: Request, context: { params: Promise<{ documentId: string }> }) {
  const actor = await requireCurrentUser();
  const { documentId } = await context.params;
  const document = await getDocumentForUser(documentId, actor);
  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  return NextResponse.json({ document });
}

export async function PATCH(request: Request, context: { params: Promise<{ documentId: string }> }) {
  const actor = await requireCurrentUser();
  const { documentId } = await context.params;
  const body = (await request.json()) as {
    action: "save" | "rename" | "pageSize" | "pageCount" | "shareEmail" | "publicLink" | "leave";
    content?: TiptapDoc;
    title?: string;
    pageSize?: string;
    pageCount?: number;
    email?: string;
    role?: string;
  };

  if (body.action === "save") {
    const parsed = tiptapDocSchema.safeParse(body.content);
    if (!parsed.success) return NextResponse.json({ error: "Invalid document content" }, { status: 400 });
    const result = await saveDocumentContent(documentId, actor, parsed.data as TiptapDoc);
    return NextResponse.json(result, { status: result.ok ? 200 : 403 });
  }

  if (body.action === "rename") {
    const parsed = titleSchema.safeParse(body.title);
    if (!parsed.success) return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    const result = await renameDocumentForUser(documentId, actor, parsed.data);
    return NextResponse.json(result, { status: result.ok ? 200 : 403 });
  }

  if (body.action === "pageSize") {
    const parsed = pageSizeSchema.safeParse(body.pageSize);
    if (!parsed.success) return NextResponse.json({ error: "Invalid page size" }, { status: 400 });
    const result = await updatePageSizeForUser(documentId, actor, parsed.data);
    return NextResponse.json(result, { status: result.ok ? 200 : 403 });
  }

  if (body.action === "pageCount") {
    const { pageCount } = body;
    if (typeof pageCount !== "number" || !Number.isInteger(pageCount) || pageCount < 1 || pageCount > 20) return NextResponse.json({ error: "Invalid page count" }, { status: 400 });
    const result = await updatePageCountForUser(documentId, actor, pageCount);
    return NextResponse.json(result, { status: result.ok ? 200 : 403 });
  }

  if (body.action === "shareEmail") {
    const parsedEmail = emailSchema.safeParse(body.email);
    const parsedRole = shareRoleSchema.safeParse(body.role);
    if (!parsedEmail.success || !parsedRole.success) return NextResponse.json({ error: "Invalid sharing request" }, { status: 400 });
    const result = await shareDocumentByEmail(documentId, actor, parsedEmail.data, parsedRole.data);
    return NextResponse.json(result, { status: result.ok ? 200 : 403 });
  }

  if (body.action === "publicLink") {
    const result = await createPublicEditorLink(documentId, actor);
    return NextResponse.json(result, { status: result.ok ? 200 : 403 });
  }

  if (body.action === "leave") {
    const result = await leaveSharedDocument(documentId, actor);
    return NextResponse.json(result, { status: result.ok ? 200 : 403 });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}

export async function DELETE(_request: Request, context: { params: Promise<{ documentId: string }> }) {
  const actor = await requireCurrentUser();
  const { documentId } = await context.params;
  const result = await deleteDocumentForOwner(documentId, actor);
  return NextResponse.json(result, { status: result.ok ? 200 : 403 });
}
