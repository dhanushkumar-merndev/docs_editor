import { and, desc, eq, ilike } from "drizzle-orm";
import { db } from "@/db/client";
import { documentActivity, documentMembers, documents, shareLinks, user as authUser } from "@/db/schema";
import { MAX_DOCUMENT_MEMBERS } from "@/lib/limits";
import { can } from "@/lib/permissions";
import type { CurrentUser } from "@/lib/session";
import type { AjaiaDocument, DocumentMember, MemberRole, PageSize, TiptapDoc } from "@/lib/types";

const emptyDoc: TiptapDoc = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export type DocumentSummary = {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  role: MemberRole;
  pageSize: PageSize;
  updatedAt: string;
};

export type LoadedDocument = AjaiaDocument & {
  role: MemberRole;
};

function toIso(value: Date | null) {
  return (value ?? new Date()).toISOString();
}

function normalizePageSize(value: string): PageSize {
  return value === "letter" || value === "custom" ? value : "a4";
}

function normalizeRole(value: string): MemberRole {
  return value === "owner" || value === "editor" ? value : "viewer";
}

async function logActivity(action: string, documentId: string | null, actor: CurrentUser, metadata: Record<string, string | number | boolean | null> = {}) {
  await db.insert(documentActivity).values({
    documentId,
    actorId: actor.id,
    actorEmail: actor.email,
    action,
    metadata,
  });
}

export async function listAccessibleDocuments(actor: CurrentUser): Promise<DocumentSummary[]> {
  const rows = await db
    .select({
      id: documents.id,
      title: documents.title,
      ownerId: documents.ownerId,
      pageSize: documents.pageSize,
      updatedAt: documents.updatedAt,
      role: documentMembers.role,
      ownerName: authUser.name,
      ownerEmail: authUser.email,
    })
    .from(documentMembers)
    .innerJoin(documents, eq(documentMembers.documentId, documents.id))
    .innerJoin(authUser, eq(documents.ownerId, authUser.id))
    .where(eq(documentMembers.userId, actor.id))
    .orderBy(desc(documents.updatedAt));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    ownerId: row.ownerId,
    ownerName: row.ownerName,
    ownerEmail: row.ownerEmail,
    role: normalizeRole(row.role),
    pageSize: normalizePageSize(row.pageSize),
    updatedAt: toIso(row.updatedAt),
  }));
}

export async function createDocumentForUser(actor: CurrentUser, title = "Untitled Document", content: TiptapDoc = emptyDoc) {
  const [doc] = await db
    .insert(documents)
    .values({
      title,
      content,
      ownerId: actor.id,
      pageSize: "a4",
    })
    .returning();

  await db.insert(documentMembers).values({
    documentId: doc.id,
    userId: actor.id,
    role: "owner",
  });
  await logActivity("document.created", doc.id, actor, { title });
  return doc.id;
}

export async function getDocumentForUser(documentId: string, actor: CurrentUser): Promise<LoadedDocument | null> {
  const [membership] = await db.select().from(documentMembers).where(and(eq(documentMembers.documentId, documentId), eq(documentMembers.userId, actor.id))).limit(1);
  if (!membership) return null;

  const [doc] = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
  if (!doc) return null;

  const members = await db
    .select({
      userId: documentMembers.userId,
      role: documentMembers.role,
      name: authUser.name,
      email: authUser.email,
    })
    .from(documentMembers)
    .innerJoin(authUser, eq(documentMembers.userId, authUser.id))
    .where(eq(documentMembers.documentId, documentId));

  const [owner] = await db.select().from(authUser).where(eq(authUser.id, doc.ownerId)).limit(1);

  return {
    id: doc.id,
    title: doc.title,
    content: doc.content as TiptapDoc,
    ownerId: doc.ownerId,
    ownerName: owner?.name ?? "Owner",
    ownerEmail: owner?.email ?? "",
    pageSize: normalizePageSize(doc.pageSize),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
    members: members.map(
      (member): DocumentMember => ({
        userId: member.userId,
        role: normalizeRole(member.role),
        name: member.name,
        email: member.email,
      }),
    ),
    role: normalizeRole(membership.role),
  };
}

export async function saveDocumentContent(documentId: string, actor: CurrentUser, content: TiptapDoc) {
  const doc = await getDocumentForUser(documentId, actor);
  if (!doc || !can(doc.role, "edit")) return { ok: false, error: "No edit access" };
  await db.update(documents).set({ content, updatedAt: new Date() }).where(eq(documents.id, documentId));
  await logActivity("document.saved", documentId, actor);
  return { ok: true, error: null };
}

export async function renameDocumentForUser(documentId: string, actor: CurrentUser, title: string) {
  const doc = await getDocumentForUser(documentId, actor);
  if (!doc || !can(doc.role, "rename")) return { ok: false, error: "Only owners can rename this document" };
  await db.update(documents).set({ title, updatedAt: new Date() }).where(eq(documents.id, documentId));
  await logActivity("document.renamed", documentId, actor, { from: doc.title, to: title });
  return { ok: true, error: null };
}

export async function updatePageSizeForUser(documentId: string, actor: CurrentUser, pageSize: PageSize) {
  const doc = await getDocumentForUser(documentId, actor);
  if (!doc || !can(doc.role, "edit")) return { ok: false, error: "No edit access" };
  await db.update(documents).set({ pageSize, updatedAt: new Date() }).where(eq(documents.id, documentId));
  await logActivity("document.page_size_changed", documentId, actor, { pageSize });
  return { ok: true, error: null };
}

export async function shareDocumentByEmail(documentId: string, actor: CurrentUser, email: string, role: Exclude<MemberRole, "owner">) {
  const doc = await getDocumentForUser(documentId, actor);
  if (!doc || !can(doc.role, "share")) return { ok: false, error: "Only owners can share this document" };

  const [target] = await db.select().from(authUser).where(eq(authUser.email, email.toLowerCase())).limit(1);
  if (!target) return { ok: false, error: "That email is not registered yet" };

  const existingMembers = await db.select().from(documentMembers).where(eq(documentMembers.documentId, documentId));
  const isExisting = existingMembers.some((member) => member.userId === target.id);
  if (!isExisting && existingMembers.length >= MAX_DOCUMENT_MEMBERS) return { ok: false, error: "House full. Try again after sometime." };

  await db
    .insert(documentMembers)
    .values({ documentId, userId: target.id, role })
    .onConflictDoUpdate({
      target: [documentMembers.documentId, documentMembers.userId],
      set: { role },
    });
  await logActivity("member.shared", documentId, actor, { email, role });
  return { ok: true, error: null };
}

export async function createPublicEditorLink(documentId: string, actor: CurrentUser) {
  const doc = await getDocumentForUser(documentId, actor);
  if (!doc || !can(doc.role, "share")) return { ok: false, error: "Only owners can share this document", token: null };
  const token = crypto.randomUUID().replaceAll("-", "");
  await db.insert(shareLinks).values({ documentId, token, role: "editor", createdBy: actor.id });
  await logActivity("share_link.created", documentId, actor, { role: "editor" });
  return { ok: true, error: null, token };
}

export async function openPublicLink(token: string, actor: CurrentUser) {
  const [link] = await db.select().from(shareLinks).where(eq(shareLinks.token, token)).limit(1);
  if (!link?.documentId) return null;
  await db
    .insert(documentMembers)
    .values({ documentId: link.documentId, userId: actor.id, role: "editor" })
    .onConflictDoUpdate({
      target: [documentMembers.documentId, documentMembers.userId],
      set: { role: "editor" },
    });
  await logActivity("share_link.opened", link.documentId, actor, { role: "editor" });
  return link.documentId;
}

export async function searchDocumentsForUser(actor: CurrentUser, query: string): Promise<DocumentSummary[]> {
  const rows = await db
    .select({
      id: documents.id,
      title: documents.title,
      ownerId: documents.ownerId,
      pageSize: documents.pageSize,
      updatedAt: documents.updatedAt,
      role: documentMembers.role,
      ownerName: authUser.name,
      ownerEmail: authUser.email,
    })
    .from(documentMembers)
    .innerJoin(documents, eq(documentMembers.documentId, documents.id))
    .innerJoin(authUser, eq(documents.ownerId, authUser.id))
    .where(and(eq(documentMembers.userId, actor.id), ilike(documents.title, `%${query}%`)))
    .limit(10);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    ownerId: row.ownerId,
    ownerName: row.ownerName,
    ownerEmail: row.ownerEmail,
    role: normalizeRole(row.role),
    pageSize: normalizePageSize(row.pageSize),
    updatedAt: toIso(row.updatedAt),
  }));
}
