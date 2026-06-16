"use client";

import { useCallback } from "react";
import type { RefObject } from "react";

// Broadcasts the user's exact textarea caret position for remote collaborator awareness.
export function useCaretBroadcast({
  canvasRef,
  enabled,
  textareaRef,
  trackPointer,
}: {
  canvasRef: RefObject<HTMLDivElement | null>;
  enabled: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  trackPointer: (x: number, y: number, options?: { editing?: boolean; force?: boolean }) => void;
}) {
  return useCallback(() => {
    const textarea = textareaRef.current;
    const canvas = canvasRef.current;
    if (!enabled || !textarea || !canvas) return;

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
    trackPointer(markerRect.left - canvasRect.left, markerRect.top - canvasRect.top, {
      editing: true,
      force: true,
    });
    mirror.remove();
  }, [canvasRef, enabled, textareaRef, trackPointer]);
}
