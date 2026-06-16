"use client";

import * as Y from "yjs";

// Binds a Y.Text CRDT value to a plain textarea without introducing a rich text editor.
export function bindYTextToTextarea(ytext: Y.Text, textarea: HTMLTextAreaElement) {
  let updating = false;

  const syncFromYText = () => {
    if (updating) return;
    const nextValue = ytext.toString();
    if (textarea.value === nextValue) return;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    textarea.value = nextValue;
    textarea.setSelectionRange(Math.min(selectionStart, nextValue.length), Math.min(selectionEnd, nextValue.length));
  };

  const syncToYText = () => {
    if (updating) return;
    updating = true;
    const nextValue = textarea.value;
    const currentValue = ytext.toString();
    let start = 0;
    while (start < currentValue.length && start < nextValue.length && currentValue[start] === nextValue[start]) {
      start += 1;
    }
    let currentEnd = currentValue.length;
    let nextEnd = nextValue.length;
    while (currentEnd > start && nextEnd > start && currentValue[currentEnd - 1] === nextValue[nextEnd - 1]) {
      currentEnd -= 1;
      nextEnd -= 1;
    }
    ytext.doc?.transact(() => {
      if (currentEnd > start) ytext.delete(start, currentEnd - start);
      if (nextEnd > start) ytext.insert(start, nextValue.slice(start, nextEnd));
    });
    updating = false;
  };

  ytext.observe(syncFromYText);
  textarea.addEventListener("input", syncToYText);
  textarea.value = ytext.toString();

  return () => {
    ytext.unobserve(syncFromYText);
    textarea.removeEventListener("input", syncToYText);
  };
}
