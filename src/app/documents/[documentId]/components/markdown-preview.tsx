import { marked } from "marked";

// Renders the optional right-side preview as Markdown HTML or plain text.
export function MarkdownPreview({ markdownText, mode }: { markdownText: string; mode: "markdown" | "plain" }) {
  return (
    <div className="flex w-1/2 min-w-0 flex-col items-center" style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div className="w-full overflow-hidden rounded-lg bg-zinc-50 p-8 shadow-sm dark:bg-zinc-900 md:p-12">
        {mode === "markdown" ? (
          <div
            className="prose prose-sm max-w-none break-words dark:prose-invert prose-pre:max-w-full prose-pre:overflow-x-auto prose-img:mx-auto prose-img:max-w-full"
            dangerouslySetInnerHTML={{ __html: marked.parse(markdownText) }}
          />
        ) : (
          <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">{markdownText}</pre>
        )}
      </div>
    </div>
  );
}
