"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EditorCanvas } from "./components/editor-canvas";
import { EditorHeader } from "./components/editor-header";
import { ShareDialog } from "./components/share-dialog";
import { pageWidthClass } from "./components/editor-types";
import { useMarkdownDocument } from "./hooks/use-markdown-document";
import type { CurrentUser } from "@/lib/session";
import type { EditorDocument } from "./components/editor-types";

// Coordinates the document editor page by wiring Yjs document state, awareness, and route-local editor UI.
export function EditorClient({ initialDocument, user }: { initialDocument: EditorDocument | null; user: CurrentUser }) {
  const [shareOpen, setShareOpen] = useState(false);
  const editorCanvasRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  } = useMarkdownDocument(initialDocument, user, textareaRef);

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

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-zinc-100 dark:bg-zinc-950">
      <EditorHeader
        activeUserIds={activeUserIds}
        doc={doc}
        exportMarkdown={exportMarkdown}
        renameDocument={renameDocument}
        role={role}
        saveState={saveState}
        setShareOpen={setShareOpen}
        setTitleDraft={setTitleDraft}
        titleDraft={titleDraft}
        user={user}
      />

      <section className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-8 lg:px-8">
        <div className={`mx-auto flex w-full items-start justify-center transition-all duration-300 ${pageWidthClass[doc.pageSize]}`}>
          <EditorCanvas
            awareness={awareness}
            canvasRef={editorCanvasRef}
            editable={editable}
            localUserId={user.id}
            markdownText={markdownText}
            onCaretMove={setAwarenessCursor}
            onDirty={() => setSaveState("dirty")}
            textareaRef={textareaRef}
          />
        </div>
      </section>

      {shareOpen ? <ShareDialog doc={doc} onClose={() => setShareOpen(false)} onDocumentChange={setDoc} /> : null}
    </main>
  );
}
