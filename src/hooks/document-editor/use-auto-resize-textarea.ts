"use client";

import { useLayoutEffect } from "react";
import type { PageSize } from "@/lib/types";
import type { RefObject } from "react";

// Keeps the Markdown textarea height matched to content so the editor page scrolls naturally.
export function useAutoResizeTextarea(
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  markdownText: string,
  previewOpen: boolean,
  pageSize: PageSize | undefined,
) {
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [markdownText, pageSize, previewOpen, textareaRef]);
}
