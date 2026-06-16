"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { can } from "@/lib/permissions";
import type { AjaiaDocument, MarkdownDoc } from "@/lib/types";
import type { RemoteDocumentDraft } from "@/hooks/use-realtime-pointer";
import type { EditorDocument, SaveState } from "@/components/document-editor/editor-types";

// Owns Markdown document state, autosave, polling, rename, export, and conflict protection.
export function useMarkdownDocument(initialDocument: EditorDocument | null, remoteDraft: RemoteDocumentDraft | null) {
  const [doc, setDoc] = useState<EditorDocument | null>(initialDocument);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [titleDraft, setTitleDraft] = useState("");
  const saveStateRef = useRef<SaveState>("saved");
  const updatedAtRef = useRef(initialDocument?.updatedAt ?? "");

  const contentObj = doc?.content;
  const initialMarkdown =
    contentObj && "format" in contentObj && contentObj.format === "markdown"
      ? (contentObj as MarkdownDoc).text
      : "";
  const [markdownText, setMarkdownText] = useState(initialMarkdown);
  const role = doc?.role ?? null;
  const editable = can(role, "edit");

  useEffect(() => {
    const id = window.setTimeout(() => setTitleDraft(doc?.title ?? ""), 0);
    return () => window.clearTimeout(id);
  }, [doc?.title]);

  useEffect(() => {
    saveStateRef.current = saveState;
  }, [saveState]);

  useEffect(() => {
    if (doc?.updatedAt) updatedAtRef.current = doc.updatedAt;
  }, [doc?.updatedAt]);

  useEffect(() => {
    if (!remoteDraft || remoteDraft.text === markdownText) return;
    // Do not apply remote drafts over a local unsaved edit; that would overwrite the user's work.
    if (editable && saveStateRef.current !== "saved") return;
    const content = { format: "markdown" as const, text: remoteDraft.text } satisfies MarkdownDoc as unknown as AjaiaDocument["content"];
    setMarkdownText(remoteDraft.text);
    setDoc((current) => (current ? { ...current, content } : current));
    setSaveState("saved");
  }, [editable, markdownText, remoteDraft]);

  const saveContent = useCallback(
    async (silent = false) => {
      if (!doc) return;
      if (!can(role, "edit")) {
        toast.error("You only have view access");
        return;
      }
      const content = { format: "markdown" as const, text: markdownText } satisfies MarkdownDoc as unknown as AjaiaDocument["content"];
      setSaveState("saving");
      try {
        const response = await fetch(`/api/documents/${doc.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          // expectedUpdatedAt prevents silent overwrites when two users save from different document versions.
          body: JSON.stringify({ action: "save", content, expectedUpdatedAt: updatedAtRef.current }),
        });
        const data = (await response.json()) as { error?: string; updatedAt?: string; conflict?: boolean; currentUpdatedAt?: string };
        if (response.status === 409 || data.conflict) {
          if (data.currentUpdatedAt) updatedAtRef.current = data.currentUpdatedAt;
          throw new Error(data.error ?? "This document changed in another session. Review the latest version before saving.");
        }
        if (!response.ok) throw new Error(data.error ?? "Save failed");
        const nextUpdatedAt = data.updatedAt ?? new Date().toISOString();
        updatedAtRef.current = nextUpdatedAt;
        setDoc((current) => (current ? { ...current, content, updatedAt: nextUpdatedAt } : current));
        setSaveState("saved");
        if (!silent) toast.success("Document saved");
      } catch (error) {
        setSaveState("error");
        toast.error(error instanceof Error ? error.message : "Save failed");
      }
    },
    [doc, role, markdownText],
  );

  useEffect(() => {
    if (!editable || saveState !== "dirty") return;
    const id = window.setTimeout(() => void saveContent(true), 1200);
    return () => window.clearTimeout(id);
  }, [editable, saveContent, saveState]);

  useEffect(() => {
    if (!doc) return;
    const id = window.setInterval(() => {
      if (saveStateRef.current !== "saved") return;
      fetch(`/api/documents/${doc.id}`)
        .then(async (response) => {
          const data = (await response.json()) as { document?: EditorDocument };
          if (!response.ok || !data.document) return;
          if (Date.parse(data.document.updatedAt) <= Date.parse(updatedAtRef.current)) return;
          const contentObj = data.document.content;
          const remoteText = contentObj && "format" in contentObj && contentObj.format === "markdown"
            ? (contentObj as MarkdownDoc).text
            : "";
          setMarkdownText(remoteText);
          updatedAtRef.current = data.document.updatedAt;
          setDoc(data.document);
          setSaveState("saved");
        })
        .catch(() => {});
    }, 5000);
    return () => window.clearInterval(id);
  }, [doc]);

  function renameDocument() {
    if (!doc) return;
    if (!can(role, "rename")) {
      setTitleDraft(doc.title);
      toast.error("Only owners can rename this document");
      return;
    }
    const nextTitle = titleDraft.trim();
    if (!nextTitle || nextTitle.length > 120) {
      toast.error("Title must be 1-120 characters");
      setTitleDraft(doc.title);
      return;
    }
    if (nextTitle !== doc.title) {
      fetch(`/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "rename", title: nextTitle }),
      })
        .then(async (response) => {
          const data = (await response.json()) as { error?: string };
          if (!response.ok) throw new Error(data.error ?? "Rename failed");
          setDoc((current) => (current ? { ...current, title: nextTitle } : current));
        })
        .catch((error: Error) => {
          toast.error(error.message);
          setTitleDraft(doc.title);
        });
    }
  }

  function exportMarkdown() {
    if (!doc) return;
    const blob = new Blob([markdownText || `# ${doc.title}\n`], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${doc.title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "ajaia-document"}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return {
    doc,
    editable,
    exportMarkdown,
    markdownText,
    renameDocument,
    role,
    saveState,
    setDoc,
    setMarkdownText,
    setSaveState,
    setTitleDraft,
    titleDraft,
  };
}
