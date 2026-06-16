import { ChevronRight, Clock, FileText, Users } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import type { DocumentSummary } from "@/lib/document-service";
import type { DashboardView } from "../dashboard-types";

const viewIcons: Record<DashboardView, typeof FileText> = {
  my: FileText,
  shared: Users,
  recent: Clock,
};

// Renders one dashboard sidebar document group with loading and empty states.
export function SidebarGroup({
  title,
  view,
  activeView,
  onView,
  docs,
  loading,
  emptyText,
  onOpenDocument,
}: {
  title: string;
  view: DashboardView;
  activeView: DashboardView;
  onView: (view: DashboardView) => void;
  docs: DocumentSummary[];
  loading: boolean;
  emptyText: string;
  onOpenDocument: (doc: DocumentSummary) => void;
}) {
  const Icon = viewIcons[view];
  const isActive = activeView === view;
  return (
    <div>
      <button
        type="button"
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide transition ${
          isActive
            ? "bg-zinc-100 text-zinc-950 hover:bg-zinc-200/60 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700/60"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50"
        }`}
        onClick={() => onView(view)}
      >
        <Icon className={`size-4 ${isActive ? "text-zinc-950 dark:text-zinc-50" : "text-zinc-400 dark:text-zinc-500"}`} />
        <span>{title}</span>
      </button>
      <div className="mt-2 space-y-1">
        {loading ? <SidebarSkeleton /> : null}
        {!loading && docs.length === 0 ? <p className="px-2 py-2 text-xs text-zinc-500 dark:text-zinc-400">{emptyText}</p> : null}
        {docs.map((doc) => (
          <Link
            key={`${title}-${doc.id}`}
            href={`/documents/${doc.id}`}
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            onClick={() => onOpenDocument(doc)}
          >
            <FileText className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{doc.title}</span>
            <ChevronRight className="size-3 shrink-0 text-zinc-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-2 px-2 py-1">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-4 w-36" />
    </div>
  );
}
