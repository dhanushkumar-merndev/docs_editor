import { marked } from "marked";

// Renders the right-hand Markdown preview pane used in split preview mode.
export function MarkdownPreview({ markdownText }: { markdownText: string }) {
  const previewHtml = marked.parse(markdownText);

  return (
    <div className="flex w-1/2 min-w-0 flex-col items-center" style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div className="w-full overflow-hidden rounded-lg bg-zinc-50 p-8 shadow-sm dark:bg-zinc-900 md:p-12">
        <div
          className="prose prose-sm max-w-none break-words dark:prose-invert prose-pre:max-w-full prose-pre:overflow-x-auto prose-img:mx-auto prose-img:max-w-full"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </div>
    </div>
  );
}
