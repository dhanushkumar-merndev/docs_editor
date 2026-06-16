"use client";

import type { RefObject } from "react";
import { PointerOverlay } from "@/components/pointer-overlay";
import type { RemotePointer } from "@/hooks/use-realtime-pointer";

// Renders the Markdown textarea canvas and remote collaborator caret overlay.
export function EditorCanvas({
  canvasRef,
  editable,
  markdownText,
  onBroadcastDraft,
  onCaretMove,
  onEditStateChange,
  onMarkdownChange,
  previewOpen,
  remotePointers,
  textareaRef,
}: {
  canvasRef: RefObject<HTMLDivElement | null>;
  editable: boolean;
  markdownText: string;
  onBroadcastDraft: (text: string) => void;
  onCaretMove: () => void;
  onEditStateChange: (editing: boolean) => void;
  onMarkdownChange: (text: string) => void;
  previewOpen: boolean;
  remotePointers: Map<string, RemotePointer>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <div className={`relative flex min-w-0 flex-col items-center transition-all duration-300 ease-out ${previewOpen ? "w-1/2" : "w-full"}`}>
      <div
        ref={canvasRef}
        className={`relative flex w-full flex-col rounded-lg bg-white p-8 shadow-sm dark:bg-zinc-900 md:p-12 ${previewOpen ? "" : "min-h-[calc(100dvh-150px)]"}`}
      >
        <textarea
          ref={textareaRef}
          className={`w-full resize-none overflow-hidden bg-transparent font-mono text-sm leading-relaxed text-zinc-800 placeholder-zinc-400 outline-none dark:text-zinc-200 ${previewOpen ? "min-h-80" : "min-h-[calc(100dvh-246px)]"}`}
          value={markdownText}
          onChange={(event) => {
            const nextText = event.target.value;
            onMarkdownChange(nextText);
            onEditStateChange(true);
            onBroadcastDraft(nextText);
            window.requestAnimationFrame(onCaretMove);
          }}
          onFocus={() => onEditStateChange(true)}
          onClick={() => window.requestAnimationFrame(onCaretMove)}
          onKeyUp={onCaretMove}
          onSelect={onCaretMove}
          onBlur={() => onEditStateChange(false)}
          placeholder="Start writing Markdown..."
          readOnly={!editable}
        />
        <PointerOverlay pointers={remotePointers} />
      </div>
    </div>
  );
}
