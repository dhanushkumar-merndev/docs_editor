import { Loader2 } from "lucide-react";

// Shows a blurred dashboard transition state while a document route is opening.
export function DocumentOpenOverlay({ title }: { title: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/35 p-6 backdrop-blur-sm">
      <div className="flex min-w-72 flex-col items-center rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <Loader2 className="size-7 animate-spin text-zinc-950 dark:text-zinc-50" />
        <p className="mt-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">Opening document</p>
        <p className="mt-1 max-w-64 truncate text-xs text-zinc-500 dark:text-zinc-400">{title}</p>
      </div>
    </div>
  );
}
