import type { AjaiaDocument, MemberRole } from "@/lib/types";

// Defines shared editor-page types used by the document editor components and hooks.
export type SaveState = "saved" | "dirty" | "saving" | "error";

export type EditorDocument = AjaiaDocument & { role: MemberRole };

export type PreviewMode = "markdown" | "plain";

export const pageWidthClass: Record<EditorDocument["pageSize"], string> = {
  a4: "max-w-[794px]",
  letter: "max-w-[816px]",
  custom: "max-w-[900px]",
};
