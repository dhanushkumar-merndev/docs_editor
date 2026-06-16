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
import type { AjaiaDocument, MarkdownDoc, TiptapDoc } from "@/lib/types";
import type { CurrentUser } from "@/lib/session";
import type { EditorDocument, SaveState } from "../components/editor-types";
import { tiptapToMarkdown, syncStringToYText } from "@/lib/document-conversion";

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
  const [format, setFormat] = useState<"markdown" | "doc">(() => {
    const contentObj = initialDocument?.content;
    if (contentObj && "format" in contentObj && contentObj.format === "markdown") {
      return "markdown";
    }
    return "doc";
  });
  const ydocRef = useRef<Y.Doc | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const providerRef = useRef<YjsSupabaseProvider | null>(null);
  const unbindTextareaRef = useRef<(() => void) | null>(null);
  const undoManagerRef = useRef<Y.UndoManager | null>(null);
  const latestTiptapJsonRef = useRef<TiptapDoc | null>(null);

  const role = doc?.role ?? null;
  const editable = can(role, "edit");

  const initialMarkdown = useMemo(() => {
    const contentObj = initialDocument?.content;
    if (!contentObj) return "";
    if ("format" in contentObj && contentObj.format === "markdown") {
      return (contentObj as MarkdownDoc).text || "";
    }
    return tiptapToMarkdown(contentObj);
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

    // Sync format using Yjs Map
    const ymap = ydoc.getMap("metadata");
    if (ymap.get("format") === undefined) {
      const initialFormat = initialDocument.content && "format" in initialDocument.content && initialDocument.content.format === "markdown"
        ? "markdown"
        : "doc";
      ymap.set("format", initialFormat);
    }

    const updateMetadata = () => {
      const currentFormat = ymap.get("format") as "markdown" | "doc";
      if (currentFormat) {
        setFormat((prev) => (prev !== currentFormat ? currentFormat : prev));
      }
    };
    ymap.observe(updateMetadata);

    const updateActiveUsers = () => {
      const states = Array.from(provider.awareness.getStates().values()) as { user?: { userId?: string } }[];
      setActiveUserIds(new Set(states.map((state) => state.user?.userId).filter((id): id is string => Boolean(id))));
    };
    provider.awareness.on("change", updateActiveUsers);
    const initialStateTimer = window.setTimeout(() => {
      setAwareness(provider.awareness);
      setMarkdownText(ytext.toString());
      updateActiveUsers();
      const currentFormat = ymap.get("format") as "markdown" | "doc";
      if (currentFormat) {
        setFormat((prev) => (prev !== currentFormat ? currentFormat : prev));
      }
    }, 0);

    return () => {
      window.clearTimeout(initialStateTimer);
      unbindTextareaRef.current?.();
      unbindTextareaRef.current = null;
      ytext.unobserve(updateMarkdownText);
      ymap.unobserve(updateMetadata);
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
    if (format !== "markdown") {
      unbindTextareaRef.current?.();
      unbindTextareaRef.current = null;
      return;
    }
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
      let content: AjaiaDocument["content"];
      if (format === "markdown") {
        const text = ytextRef.current?.toString() ?? markdownText;
        content = { format: "markdown", text };
      } else {
        content = (latestTiptapJsonRef.current ?? (doc.content && !("format" in doc.content) ? doc.content : { type: "doc", content: [] })) as TiptapDoc;
      }
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
    [doc, role, format, markdownText],
  );

  const changeFormat = useCallback(
    async (newFormat: "markdown" | "doc", currentTiptapJson?: TiptapDoc | null) => {
      if (!doc) return;
      if (role !== "owner") {
        toast.error("Only owners can change the document format");
        return;
      }

      ydocRef.current?.getMap("metadata").set("format", newFormat);
      setFormat(newFormat);

      let newContent: AjaiaDocument["content"];
      if (newFormat === "markdown") {
        const json = currentTiptapJson ?? latestTiptapJsonRef.current ?? (doc.content && !("format" in doc.content) ? doc.content : null);
        const markdown = tiptapToMarkdown(json);
        const ytext = ytextRef.current;
        if (ytext) {
          syncStringToYText(ytext, markdown);
        }
        newContent = { format: "markdown", text: markdown };
      } else {
        const markdown = ytextRef.current?.toString() ?? markdownText;
        newContent = currentTiptapJson ?? {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: markdown ? [{ type: "text", text: markdown }] : [],
            },
          ],
        };
        latestTiptapJsonRef.current = newContent;
      }

      setDoc((current) => (current ? { ...current, content: newContent } : null));

      setSaveState("saving");
      try {
        const response = await fetch(`/api/documents/${doc.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "save", content: newContent }),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(data.error ?? "Save failed");
        setSaveState("saved");
        toast.success(`Document converted to ${newFormat === "markdown" ? "Markdown" : "Doc"}`);
      } catch (err) {
        setSaveState("error");
        toast.error(err instanceof Error ? err.message : "Conversion save failed");
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
    format,
    changeFormat,
    latestTiptapJsonRef,
    ytextRef,
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
