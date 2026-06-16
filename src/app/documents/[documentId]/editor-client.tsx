"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRealtimePointer } from "@/hooks/use-realtime-pointer";
import { EditorCanvas } from "./components/editor-canvas";
import { EditorHeader } from "./components/editor-header";
import { MarkdownPreview } from "./components/markdown-preview";
import { ShareDialog } from "./components/share-dialog";
import { pageWidthClass } from "./components/editor-types";
import { useCaretBroadcast } from "./hooks/use-caret-broadcast";
import { useAutoResizeTextarea } from "./hooks/use-auto-resize-textarea";
import { useMarkdownDocument } from "./hooks/use-markdown-document";
import type { CurrentUser } from "@/lib/session";
import type { EditorDocument } from "./components/editor-types";

// Coordinates the document editor page by wiring document state, realtime presence, and reusable editor UI.
export function EditorClient({ initialDocument, user }: { initialDocument: EditorDocument | null; user: CurrentUser }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const editorCanvasRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { activeUserIds, remoteDraft, remotePointers, trackPointer, trackEditing, broadcastDocumentDraft } = useRealtimePointer(
    initialDocument?.id ?? "",
    user.id,
    user.name,
  );

  const {
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
  } = useMarkdownDocument(initialDocument, remoteDraft);

  const livePointersEnabled = Boolean(doc?.members && doc.members.length > 1);
  const sendCaretPosition = useCaretBroadcast({
    canvasRef: editorCanvasRef,
    enabled: livePointersEnabled,
    textareaRef,
    trackPointer,
  });

  useAutoResizeTextarea(textareaRef, markdownText, previewOpen, doc?.pageSize);

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
        previewOpen={previewOpen}
        renameDocument={renameDocument}
        role={role}
        saveState={saveState}
        setPreviewOpen={setPreviewOpen}
        setShareOpen={setShareOpen}
        setTitleDraft={setTitleDraft}
        titleDraft={titleDraft}
        user={user}
      />

      <section className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-8 lg:px-8">
        <div className={`mx-auto flex w-full items-start gap-6 transition-all duration-300 ${previewOpen ? "max-w-[1680px]" : `justify-center ${pageWidthClass[doc.pageSize]}`}`}>
          <EditorCanvas
            canvasRef={editorCanvasRef}
            editable={editable}
            markdownText={markdownText}
            onBroadcastDraft={broadcastDocumentDraft}
            onCaretMove={sendCaretPosition}
            onEditStateChange={trackEditing}
            onMarkdownChange={(nextText) => {
              setMarkdownText(nextText);
              setSaveState("dirty");
            }}
            previewOpen={previewOpen}
            remotePointers={remotePointers}
            textareaRef={textareaRef}
          />
          {previewOpen ? <MarkdownPreview markdownText={markdownText} /> : null}
        </div>
      </section>

      {shareOpen ? <ShareDialog doc={doc} onClose={() => setShareOpen(false)} onDocumentChange={setDoc} /> : null}
    </main>
  );
}
