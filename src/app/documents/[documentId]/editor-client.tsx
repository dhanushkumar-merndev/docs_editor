"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EditorCanvas } from "./components/editor-canvas";
import { EditorHeader } from "./components/editor-header";
import { MarkdownPreview } from "./components/markdown-preview";
import { ShareDialog } from "./components/share-dialog";
import { pageWidthClass } from "./components/editor-types";
import { useMarkdownDocument } from "./hooks/use-markdown-document";
import type { CurrentUser } from "@/lib/session";
import type { EditorDocument, PreviewMode } from "./components/editor-types";

// Coordinates the document editor page by wiring Yjs document state, awareness, and route-local editor UI.
export function EditorClient({ initialDocument, user }: { initialDocument: EditorDocument | null; user: CurrentUser }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("markdown");
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const editorCanvasRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Reads the textarea selection and returns the set of active markdown formats. */
  const detectActiveFormats = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const value = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Current line (for block-level formats)
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = value.indexOf("\n", end);
    const line = value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd);

    const next = new Set<string>();
    if (/^### /.test(line)) next.add("h3");
    else if (/^## /.test(line)) next.add("h2");
    else if (/^# /.test(line)) next.add("h1");
    if (/^- /.test(line)) next.add("bullet");
    if (/^\d+\. /.test(line)) next.add("numbered");

    // Inline: check if selection (or word at cursor) is wrapped in ** or _
    const selected = value.slice(start, end);
    const before = value.slice(Math.max(0, start - 2), start);
    const after = value.slice(end, Math.min(value.length, end + 2));
    if (
      (selected.startsWith("**") && selected.endsWith("**") && selected.length > 4) ||
      (before === "**" && after === "**")
    ) next.add("bold");
    const beforeOne = value.slice(Math.max(0, start - 1), start);
    const afterOne = value.slice(end, Math.min(value.length, end + 1));
    if (
      (selected.startsWith("_") && selected.endsWith("_") && selected.length > 2) ||
      (beforeOne === "_" && afterOne === "_")
    ) next.add("italic");

    setActiveFormats(next);
  }, []);

  const {
    activeUserIds,
    awareness,
    doc,
    editable,
    exportMarkdown,
    markdownText,
    renameDocument,
    role,
    saveState,
    setAwarenessCursor,
    setDoc,
    setSaveState,
    setTitleDraft,
    titleDraft,
    undo,
    redo,
  } = useMarkdownDocument(initialDocument, user, textareaRef);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const ctrl = isMac ? e.metaKey : e.ctrlKey;
      if (!ctrl) return;

      let format: Parameters<typeof applyMarkdownFormat>[0] | null = null;

      if (e.key === "z" && !e.shiftKey) format = "undo";
      else if ((e.key === "z" && e.shiftKey) || e.key === "y") format = "redo";
      else if (e.key === "b") format = "bold";
      else if (e.key === "i") format = "italic";
      else if (e.key === "1") format = "h1";
      else if (e.key === "2") format = "h2";
      else if (e.key === "3") format = "h3";
      else if (e.key === " " && !e.shiftKey) format = "bullet";
      else if (e.key === " " && e.shiftKey) format = "numbered";

      if (format) {
        e.preventDefault();
        applyMarkdownFormat(format);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  if (!doc || !role) {
    return (
      <main className="grid min-h-dvh place-items-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Document not found</h1>
          <p className="mt-2 text-zinc-500">It may not exist, or your account does not have access.</p>
          <Link className="mt-5 inline-flex" href="/dashboard">
            <Button>Back to dashboard</Button>
          </Link>
        </div>
      </main>
    );
  }

  function applyMarkdownFormat(kind: "bold" | "italic" | "h1" | "h2" | "h3" | "bullet" | "numbered" | "undo" | "redo") {
    if (kind === "undo") {
      undo();
      return;
    }
    if (kind === "redo") {
      redo();
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea || !editable) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const selected = value.slice(start, end) || "text";
    let nextValue = value;
    let nextStart = start;
    let nextEnd = end;

    if (kind === "bold" || kind === "italic") {
      const marker = kind === "bold" ? "**" : "_";
      const replacement = `${marker}${selected}${marker}`;
      nextValue = `${value.slice(0, start)}${replacement}${value.slice(end)}`;
      nextStart = start + marker.length;
      nextEnd = nextStart + selected.length;
    } else {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const lineEnd = value.indexOf("\n", end);
      const safeLineEnd = lineEnd === -1 ? value.length : lineEnd;
      const block = value.slice(lineStart, safeLineEnd);
      const prefix = kind === "h1" ? "# " : kind === "h2" ? "## " : kind === "h3" ? "### " : kind === "bullet" ? "- " : "1. ";
      const replacement = block
        .split("\n")
        .map((line, index) => (kind === "numbered" ? `${index + 1}. ${line.replace(/^\d+\.\s*/, "")}` : `${prefix}${line.replace(/^(#{1,3}|-)\s*/, "")}`))
        .join("\n");
      nextValue = `${value.slice(0, lineStart)}${replacement}${value.slice(safeLineEnd)}`;
      nextStart = lineStart;
      nextEnd = lineStart + replacement.length;
    }

    textarea.value = nextValue;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextStart, nextEnd);
    });
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-zinc-100 dark:bg-zinc-950">
      <EditorHeader
        activeFormats={activeFormats}
        activeUserIds={activeUserIds}
        doc={doc}
        editable={editable}
        exportMarkdown={exportMarkdown}
        onFormat={applyMarkdownFormat}
        onDocumentChange={setDoc}
        previewMode={previewMode}
        previewOpen={previewOpen}
        renameDocument={renameDocument}
        role={role}
        saveState={saveState}
        setPreviewMode={setPreviewMode}
        setPreviewOpen={setPreviewOpen}
        setShareOpen={setShareOpen}
        setTitleDraft={setTitleDraft}
        titleDraft={titleDraft}
        user={user}
      />

      <section className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-8 lg:px-8">
        <div className={`mx-auto flex w-full items-start gap-6 transition-all duration-300 ${previewOpen ? "max-w-[1680px]" : `justify-center ${pageWidthClass[doc.pageSize]}`}`}>
          <EditorCanvas
            awareness={awareness}
            canvasRef={editorCanvasRef}
            editable={editable}
            localUserId={user.id}
            markdownText={markdownText}
            onCaretMove={setAwarenessCursor}
            onDirty={() => setSaveState("dirty")}
            onSelectionChange={detectActiveFormats}
            previewOpen={previewOpen}
            textareaRef={textareaRef}
          />
          {previewOpen ? <MarkdownPreview markdownText={markdownText} mode={previewMode} /> : null}
        </div>
      </section>

      {shareOpen ? <ShareDialog doc={doc} onClose={() => setShareOpen(false)} onDocumentChange={setDoc} /> : null}
    </main>
  );
}
