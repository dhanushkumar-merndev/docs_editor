"use client";

import type { RefObject } from "react";
import type { Awareness } from "y-protocols/awareness";
import { YjsPointerOverlay } from "@/components/yjs-pointer-overlay";

// Renders the Markdown textarea canvas and Yjs Awareness collaborator caret overlay.
export function EditorCanvas({
  awareness,
  canvasRef,
  editable,
  localUserId,
  markdownText,
  onCaretMove,
  onDirty,
  onSelectionChange,
  previewOpen,
  textareaRef,
}: {
  awareness: Awareness | null;
  canvasRef: RefObject<HTMLDivElement | null>;
  editable: boolean;
  localUserId: string;
  markdownText: string;
  onCaretMove: (cursor: { x: number; y: number }) => void;
  onDirty: () => void;
  onSelectionChange: () => void;
  previewOpen: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  function sendCaretPosition() {
    const textarea = textareaRef.current;
    const canvas = canvasRef.current;
    if (!textarea || !canvas) return;

    const style = window.getComputedStyle(textarea);
    const mirror = document.createElement("div");
    const marker = document.createElement("span");
    const textareaRect = textarea.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    // Mirror the textarea styles so the remote caret lands beside the real insertion point.
    mirror.style.position = "fixed";
    mirror.style.left = `${textareaRect.left}px`;
    mirror.style.top = `${textareaRect.top}px`;
    mirror.style.width = `${textarea.clientWidth}px`;
    mirror.style.visibility = "hidden";
    mirror.style.whiteSpace = "pre-wrap";
    mirror.style.overflowWrap = "break-word";
    mirror.style.font = style.font;
    mirror.style.letterSpacing = style.letterSpacing;
    mirror.style.lineHeight = style.lineHeight;
    mirror.style.padding = style.padding;
    mirror.style.border = style.border;
    mirror.textContent = textarea.value.slice(0, textarea.selectionStart);
    marker.textContent = "\u200b";
    mirror.appendChild(marker);
    document.body.appendChild(mirror);

    const markerRect = marker.getBoundingClientRect();
    onCaretMove({ x: markerRect.left - canvasRect.left, y: markerRect.top - canvasRect.top });
    mirror.remove();
  }

  return (
    <div className={`relative flex min-w-0 flex-col items-center transition-all duration-300 ease-out ${previewOpen ? "w-1/2" : "w-full"}`}>
      <div
        ref={canvasRef}
        className={`relative flex w-full flex-col rounded-lg bg-white p-8 shadow-sm dark:bg-zinc-900 md:p-12 ${previewOpen ? "" : "min-h-[calc(100dvh-150px)]"}`}
      >
        <textarea
          ref={textareaRef}
          className={`w-full resize-none overflow-hidden bg-transparent font-mono text-sm leading-relaxed text-zinc-800 outline-none [field-sizing:content] placeholder-zinc-400 dark:text-zinc-200 ${previewOpen ? "min-h-[2lh]" : "min-h-[calc(100dvh-246px)]"}`}
          value={markdownText}
          onChange={() => {
            onDirty();
            window.requestAnimationFrame(() => { sendCaretPosition(); onSelectionChange(); });
          }}
          onClick={() => window.requestAnimationFrame(() => { sendCaretPosition(); onSelectionChange(); })}
          onKeyUp={() => { sendCaretPosition(); onSelectionChange(); }}
          onSelect={() => { sendCaretPosition(); onSelectionChange(); }}
          placeholder="Start writing Markdown..."
          readOnly={!editable}
        />
        <YjsPointerOverlay awareness={awareness} localUserId={localUserId} />
      </div>
    </div>
  );
}
