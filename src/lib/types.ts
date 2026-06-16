import type { JSONContent } from "@tiptap/core";

export type MemberRole = "owner" | "editor" | "viewer";
export type PageSize = "a4" | "letter" | "custom";

export type TiptapDoc = JSONContent & {
  type: "doc";
};

export type MarkdownDoc = {
  format: "markdown";
  text: string;
};

export type DocumentMember = {
  userId: string;
  role: MemberRole;
  name: string;
  email: string;
  image: string | null;
};

export type AjaiaDocument = {
  id: string;
  title: string;
  content: TiptapDoc | MarkdownDoc;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  pageSize: PageSize;
  pageCount: number;
  members: DocumentMember[];
  createdAt: string;
  updatedAt: string;
};

export type ShareLink = {
  token: string;
  documentId: string;
  role: Exclude<MemberRole, "owner">;
  createdAt: string;
};

export type DocumentActivityAction =
  | "document.created"
  | "document.imported"
  | "document.renamed"
  | "document.saved"
  | "document.deleted"
  | "document.ownership_transferred"
  | "member.shared"
  | "member.left"
  | "member.role_changed"
  | "member.removed"
  | "share_link.created"
  | "share_link.opened"
  | "profile.updated";

export type DocumentActivity = {
  id: string;
  documentId: string | null;
  actorId: string;
  actorEmail: string;
  action: DocumentActivityAction;
  metadata: Record<string, string | number | boolean | null>;
  createdAt: string;
};

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };
