"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { toast } from "sonner";
import * as Y from "yjs";
import type { Awareness } from "y-protocols/awareness";
import { can } from "@/lib/permissions";
import { getCollabColor } from "@/lib/collab-colors";
import { YjsSupabaseProvider } from "@/lib/y-supabase-provider";
import { bindYTextToTextarea } from "@/lib/y-textarea";
import type { AjaiaDocument, MarkdownDoc } from "@/lib/types";
import type { CurrentUser } from "@/lib/session";
import type { EditorDocument, SaveState } from "../components/editor-types";

// Owns the Yjs-backed Markdown document state, autosave, rename, export, and awareness lifecycle.
export function useMarkdownDocument(
  initialDocument: EditorDocument | null,
  user: CurrentUser,
  textareaRef: RefObject<HTMLTextAreaElement | null>,
) {
  const [doc, setDoc] = useState<EditorDocument | null>(initialDocument);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [titleDraft, setTitleDraft] = useState("");
  const [markdownText, setMarkdownText] = useState("");
  const [awareness, setAwareness] = useState<Awareness | null>(null);
  const [activeUserIds, setActiveUserIds] = useState<Set<string>>(new Set([user.id]));
  const ydocRef = useRef<Y.Doc | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const providerRef = useRef<YjsSupabaseProvider | null>(null);
  const unbindTextareaRef = useRef<(() => void) | null>(null);
  const undoManagerRef = useRef<Y.UndoManager | null>(null);

  const role = doc?.role ?? null;
  const editable = can(role, "edit");

  const initialMarkdown = useMemo(() => {
    const contentObj = initialDocument?.content;
    return contentObj && "format" in contentObj && contentObj.format === "markdown"
      ? (contentObj as MarkdownDoc).text
      : "";
  }, [initialDocument]);

  useEffect(() => {
    const id = window.setTimeout(() => setTitleDraft(doc?.title ?? ""), 0);
    return () => window.clearTimeout(id);
  }, [doc?.title]);

  useEffect(() => {
    if (!initialDocument) return;
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText("content");
    Y.applyUpdate(ydoc, createInitialMarkdownUpdate(initialMarkdown), "initial-markdown");
    const provider = new YjsSupabaseProvider(initialDocument.id, ydoc, {
      userId: user.id,
      name: user.name,
      color: getCollabColor(user.id),
    });

    ydocRef.current = ydoc;
    ytextRef.current = ytext;
    providerRef.current = provider;
    undoManagerRef.current = new Y.UndoManager(ytext);

    const updateMarkdownText = () => setMarkdownText(ytext.toString());
    ytext.observe(updateMarkdownText);

    const updateActiveUsers = () => {
      const states = Array.from(provider.awareness.getStates().values()) as { user?: { userId?: string } }[];
      setActiveUserIds(new Set(states.map((state) => state.user?.userId).filter((id): id is string => Boolean(id))));
    };
    provider.awareness.on("change", updateActiveUsers);
    const initialStateTimer = window.setTimeout(() => {
      setAwareness(provider.awareness);
      setMarkdownText(ytext.toString());
      updateActiveUsers();
    }, 0);

    return () => {
      window.clearTimeout(initialStateTimer);
      unbindTextareaRef.current?.();
      unbindTextareaRef.current = null;
      ytext.unobserve(updateMarkdownText);
      provider.awareness.off("change", updateActiveUsers);
      provider.destroy();
      ydoc.destroy();
      ydocRef.current = null;
      ytextRef.current = null;
      providerRef.current = null;
      undoManagerRef.current = null;
      setAwareness(null);
    };
  }, [initialDocument, initialMarkdown, user.id, user.name]);

  useEffect(() => {
    const textarea = textareaRef.current;
    const ytext = ytextRef.current;
    if (!textarea || !ytext || unbindTextareaRef.current) return;
    unbindTextareaRef.current = bindYTextToTextarea(ytext, textarea);
  });

  const saveContent = useCallback(
    async (silent = false) => {
      if (!doc) return;
      if (!can(role, "edit")) {
        toast.error("You only have view access");
        return;
      }
      const text = ytextRef.current?.toString() ?? markdownText;
      const content = { format: "markdown" as const, text } satisfies MarkdownDoc as unknown as AjaiaDocument["content"];
      setSaveState("saving");
      try {
        const response = await fetch(`/api/documents/${doc.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "save", content }),
        });
        const data = (await response.json()) as { error?: string; updatedAt?: string };
        if (!response.ok) throw new Error(data.error ?? "Save failed");
        const nextUpdatedAt = data.updatedAt ?? new Date().toISOString();
        setDoc((current) => (current ? { ...current, content, updatedAt: nextUpdatedAt } : current));
        setSaveState("saved");
        if (!silent) toast.success("Document saved");
      } catch (error) {
        setSaveState("error");
        if (!silent) toast.error(error instanceof Error ? error.message : "Save failed");
      }
    },
    [doc, role, markdownText],
  );

  useEffect(() => {
    if (!editable || saveState !== "dirty") return;
    const id = window.setTimeout(() => void saveContent(true), 1200);
    return () => window.clearTimeout(id);
  }, [editable, saveContent, saveState]);

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
    const blob = new Blob([ytextRef.current?.toString() || `# ${doc.title}\n`], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${doc.title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "ajaia-document"}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function setAwarenessCursor(cursor: { x: number; y: number }) {
    providerRef.current?.awareness.setLocalStateField("cursor", cursor);
  }
  const undo = useCallback(() => {
    if (undoManagerRef.current) {
      undoManagerRef.current.undo();
    }
  }, []);

  const redo = useCallback(() => {
    if (undoManagerRef.current) {
      undoManagerRef.current.redo();
    }
  }, []);
  return {
    activeUserIds,
    awareness,
    doc,
    editable,
    exportMarkdown,
    markdownText,
    renameDocument,
    role,
    saveContent,
    saveState,
    setAwarenessCursor,
    setDoc,
    setSaveState,
    setTitleDraft,
    titleDraft,
    undo,
    redo,
  };
}

function createInitialMarkdownUpdate(text: string) {
  const seedDoc = new Y.Doc();
  // A deterministic client id makes the DB snapshot idempotent across browser tabs.
  (seedDoc as Y.Doc & { clientID: number }).clientID = 1;
  seedDoc.getText("content").insert(0, text);
  const update = Y.encodeStateAsUpdate(seedDoc);
  seedDoc.destroy();
  return update;
}
