import { and, desc, eq, ilike } from "drizzle-orm";
import { db } from "@/db/client";
import { documentActivity, documentMembers, documents, user as authUser } from "@/db/schema";
import { MAX_DOCUMENT_MEMBERS } from "@/lib/limits";
import { can } from "@/lib/permissions";
import type { CurrentUser } from "@/lib/session";
import type { AjaiaDocument, DocumentMember, MemberRole, PageSize, TiptapDoc, MarkdownDoc } from "@/lib/types";

const emptyMarkdown: MarkdownDoc = {
  format: "markdown",
  text: "",
};

function isTiptapDoc(content: TiptapDoc | MarkdownDoc): content is TiptapDoc {
  return "type" in content && content.type === "doc";
}

export type DocumentSummary = {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  role: MemberRole;
  pageSize: PageSize;
  pageCount: number;
  createdAt: string;
  sharedAt: string;
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
      pageCount: documents.pageCount,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
      sharedAt: documentMembers.createdAt,
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
    pageCount: Math.max(1, row.pageCount),
    createdAt: toIso(row.createdAt),
    sharedAt: toIso(row.sharedAt),
    updatedAt: toIso(row.updatedAt),
  }));
}

export async function createDocumentForUser(actor: CurrentUser, title = "Untitled Document", content?: TiptapDoc | MarkdownDoc, imported = false) {
  const docContent = content ?? emptyMarkdown;
  const [doc] = await db
    .insert(documents)
    .values({
      title,
      content: docContent,
      ownerId: actor.id,
      pageSize: "a4",
      pageCount: 1,
    })
    .returning();

  await db.insert(documentMembers).values({
    documentId: doc.id,
    userId: actor.id,
    role: "owner",
  });
  await logActivity(imported ? "document.imported" : "document.created", doc.id, actor, { title });
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
      image: authUser.image,
    })
    .from(documentMembers)
    .innerJoin(authUser, eq(documentMembers.userId, authUser.id))
    .where(eq(documentMembers.documentId, documentId));

  const [owner] = await db.select().from(authUser).where(eq(authUser.id, doc.ownerId)).limit(1);

  return {
    id: doc.id,
    title: doc.title,
    content: doc.content as TiptapDoc | MarkdownDoc,
    ownerId: doc.ownerId,
    ownerName: owner?.name ?? "Owner",
    ownerEmail: owner?.email ?? "",
    pageSize: normalizePageSize(doc.pageSize),
    pageCount: Math.max(1, doc.pageCount),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
    members: members.map(
      (member): DocumentMember => ({
        userId: member.userId,
        role: normalizeRole(member.role),
        name: member.name,
        email: member.email,
        image: member.image ?? null,
      }),
    ),
    role: normalizeRole(membership.role),
  };
}

export async function saveDocumentContent(documentId: string, actor: CurrentUser, content: TiptapDoc | MarkdownDoc) {
  const doc = await getDocumentForUser(documentId, actor);
  if (!doc || !can(doc.role, "edit")) return { ok: false, error: "No edit access" };
  const updatedAt = new Date();
  await db.update(documents).set({ content, updatedAt }).where(eq(documents.id, documentId));
  await logActivity("document.saved", documentId, actor);
  return { ok: true, error: null, updatedAt: updatedAt.toISOString() };
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

export async function updatePageCountForUser(documentId: string, actor: CurrentUser, pageCount: number) {
  const doc = await getDocumentForUser(documentId, actor);
  if (!doc || !can(doc.role, "edit")) return { ok: false, error: "No edit access" };
  const nextPageCount = Math.max(1, Math.min(20, pageCount));
  await db.update(documents).set({ pageCount: nextPageCount, updatedAt: new Date() }).where(eq(documents.id, documentId));
  await logActivity("document.page_count_changed", documentId, actor, { from: doc.pageCount, to: nextPageCount });
  return { ok: true, error: null, pageCount: nextPageCount };
}

export async function deleteDocumentForOwner(documentId: string, actor: CurrentUser) {
  const doc = await getDocumentForUser(documentId, actor);
  if (!doc || !can(doc.role, "delete")) return { ok: false, error: "Only owners can delete this document" };
  await logActivity("document.deleted", documentId, actor, { title: doc.title });
  await db.delete(documents).where(eq(documents.id, documentId));
  return { ok: true, error: null };
}

export async function leaveSharedDocument(documentId: string, actor: CurrentUser) {
  const doc = await getDocumentForUser(documentId, actor);
  if (!doc) return { ok: false, error: "Document not found" };
  if (doc.role === "owner") return { ok: false, error: "Owners cannot leave their own document" };
  await logActivity("member.left", documentId, actor, { title: doc.title, role: doc.role });
  await db.delete(documentMembers).where(and(eq(documentMembers.documentId, documentId), eq(documentMembers.userId, actor.id)));
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

export async function searchDocumentsForUser(actor: CurrentUser, query: string): Promise<DocumentSummary[]> {
  const rows = await db
    .select({
      id: documents.id,
      title: documents.title,
      ownerId: documents.ownerId,
      pageSize: documents.pageSize,
      pageCount: documents.pageCount,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
      sharedAt: documentMembers.createdAt,
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
    pageCount: Math.max(1, row.pageCount),
    createdAt: toIso(row.createdAt),
    sharedAt: toIso(row.sharedAt),
    updatedAt: toIso(row.updatedAt),
  }));
}

export async function transferDocumentOwnership(documentId: string, actor: CurrentUser, newOwnerUserId: string) {
  const doc = await getDocumentForUser(documentId, actor);
  if (!doc || !can(doc.role, "transferOwnership")) return { ok: false, error: "Only owners can transfer ownership" };
  if (newOwnerUserId === actor.id) return { ok: false, error: "You are already the owner" };

  // New owner must already be a member
  const [targetMembership] = await db
    .select()
    .from(documentMembers)
    .where(and(eq(documentMembers.documentId, documentId), eq(documentMembers.userId, newOwnerUserId)))
    .limit(1);
  if (!targetMembership) return { ok: false, error: "That user is not a member of this document" };

  // Atomic: update owner in documents, promote new owner, demote old owner
  await db.update(documents).set({ ownerId: newOwnerUserId, updatedAt: new Date() }).where(eq(documents.id, documentId));
  await db
    .update(documentMembers)
    .set({ role: "owner" })
    .where(and(eq(documentMembers.documentId, documentId), eq(documentMembers.userId, newOwnerUserId)));
  await db
    .update(documentMembers)
    .set({ role: "editor" })
    .where(and(eq(documentMembers.documentId, documentId), eq(documentMembers.userId, actor.id)));

  await logActivity("document.ownership_transferred", documentId, actor, { to: newOwnerUserId });
  return { ok: true, error: null };
}

export async function updateMemberRoleForOwner(
  documentId: string,
  actor: CurrentUser,
  targetUserId: string,
  newRole: Exclude<MemberRole, "owner">,
) {
  const doc = await getDocumentForUser(documentId, actor);
  if (!doc || !can(doc.role, "share")) return { ok: false, error: "Only owners can change member roles" };
  if (targetUserId === actor.id) return { ok: false, error: "Cannot change your own role" };
  await db
    .update(documentMembers)
    .set({ role: newRole })
    .where(and(eq(documentMembers.documentId, documentId), eq(documentMembers.userId, targetUserId)));
  await logActivity("member.role_changed", documentId, actor, { userId: targetUserId, role: newRole });
  return { ok: true, error: null };
}

export async function removeMemberForOwner(documentId: string, actor: CurrentUser, targetUserId: string) {
  const doc = await getDocumentForUser(documentId, actor);
  if (!doc || !can(doc.role, "share")) return { ok: false, error: "Only owners can remove members" };
  if (targetUserId === actor.id) return { ok: false, error: "Cannot remove yourself" };
  await db
    .delete(documentMembers)
    .where(and(eq(documentMembers.documentId, documentId), eq(documentMembers.userId, targetUserId)));
  await logActivity("member.removed", documentId, actor, { userId: targetUserId });
  return { ok: true, error: null };
}
