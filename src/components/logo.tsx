import { BookOpenText } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid size-9 place-items-center rounded-lg bg-zinc-950 text-white shadow-sm dark:bg-white dark:text-zinc-950">
        <BookOpenText className="size-5" strokeWidth={2.4} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Ajaia Docs</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Collaborative editor</p>
        </div>
      )}
    </div>
  );
}
