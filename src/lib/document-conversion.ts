import type { JSONContent } from "@tiptap/core";
import * as Y from "yjs";

/**
 * Converts a Tiptap JSON document structure back into raw Markdown text.
 */
export function tiptapToMarkdown(node: JSONContent | null | undefined): string {
  if (!node) return "";

  if (node.type === "text") {
    let text = node.text || "";
    if (node.marks) {
      // Apply marks in a stable order
      const sortedMarks = [...node.marks].sort((a, b) => a.type.localeCompare(b.type));
      for (const mark of sortedMarks) {
        if (mark.type === "bold") {
          text = `**${text}**`;
        } else if (mark.type === "italic") {
          text = `_${text}_`;
        } else if (mark.type === "underline") {
          text = `<u>${text}</u>`;
        }
      }
    }
    return text;
  }

  const childrenMarkdown = (node.content || []).map(tiptapToMarkdown).join("");

  switch (node.type) {
    case "doc":
      return (node.content || []).map(tiptapToMarkdown).join("\n\n");
    case "paragraph":
      return childrenMarkdown;
    case "heading": {
      const level = node.attrs?.level || 1;
      const hashes = "#".repeat(level);
      return `${hashes} ${childrenMarkdown}`;
    }
    case "bulletList":
      return (node.content || []).map((li) => `- ${tiptapToMarkdown(li)}`).join("\n");
    case "orderedList":
      return (node.content || []).map((li, idx) => `${idx + 1}. ${tiptapToMarkdown(li)}`).join("\n");
    case "listItem":
      return childrenMarkdown;
    case "image": {
      const alt = node.attrs?.alt || "";
      const src = node.attrs?.src || "";
      return `![${alt}](${src})`;
    }
    case "horizontalRule":
      return "---";
    case "hardBreak":
      return "\n";
    default:
      return childrenMarkdown;
  }
}

/**
 * Updates a Y.Text object with a new string value using a minimal diffing algorithm.
 */
export function syncStringToYText(ytext: Y.Text, nextValue: string) {
  const currentValue = ytext.toString();
  if (currentValue === nextValue) return;

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
}
