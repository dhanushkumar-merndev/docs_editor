import Image from "next/image";
import { BookOpenText } from "lucide-react";

export function Logo({ compact = false, inverted = false }: { compact?: boolean; inverted?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={inverted ? "grid size-9 place-items-center rounded-lg bg-white text-zinc-950 shadow-sm" : "grid size-9 place-items-center rounded-lg bg-white border border-zinc-200 text-zinc-950 shadow-sm dark:border-none"}>
        <Image src="/book.png" alt="" width={28} height={28} className="size-7 rounded-md object-cover" priority />
        <BookOpenText className="hidden size-5" strokeWidth={2.4} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className={inverted ? "text-sm font-semibold text-white" : "text-sm font-semibold text-zinc-950 dark:text-zinc-50"}>Ajaia Docs</p>
          <p className={inverted ? "text-xs text-zinc-300" : "text-xs text-zinc-500 dark:text-zinc-400"}>Collaborative editor</p>
        </div>
      )}
    </div>
  );
}
