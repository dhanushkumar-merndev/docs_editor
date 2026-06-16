import { Edit3, Share2, Trash2, UserMinus } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, type TimeFormat, type TimeZonePreference } from "@/lib/utils";
import type { DocumentSummary } from "@/lib/document-service";
import type { PendingAction } from "../dashboard-types";

// Renders the active dashboard document list and per-document actions.
export function DocumentTable({
  docs,
  loading,
  emptyText,
  timeFormat,
  timeZone,
  onAction,
}: {
  docs: DocumentSummary[];
  loading: boolean;
  emptyText: string;
  timeFormat: TimeFormat;
  timeZone: TimeZonePreference;
  onAction: (action: PendingAction) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {loading ? <TableSkeleton /> : null}
      {!loading && docs.length === 0 ? <p className="p-5 text-sm text-zinc-500 dark:text-zinc-400">{emptyText}</p> : null}
      {docs.map((doc) => (
        <div key={doc.id} className="grid gap-4 border-t border-zinc-200 px-5 py-4 first:border-t-0 dark:border-zinc-800 md:grid-cols-[1fr_auto] md:items-center">
          <Link href={`/documents/${doc.id}`} className="min-w-0">
            <p className="truncate font-medium">{doc.title}</p>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{formatDate(doc.updatedAt, timeFormat, timeZone)}</p>
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-6">
            <Link href={`/documents/${doc.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
              <Edit3 className="size-4" />
              {doc.role === "viewer" ? "View" : "Edit"}
            </Link>
            {doc.role === "owner" ? (
              <>
                <Link href={`/documents/${doc.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
                  <Share2 className="size-4" />
                  Share
                </Link>
                <button type="button" className="inline-flex items-center text-sm font-medium text-red-600 transition hover:text-red-700" aria-label={`Delete ${doc.title}`} onClick={() => onAction({ type: "delete", doc })}>
                  <Trash2 className="size-4" />
                </button>
              </>
            ) : (
              <button type="button" className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 transition hover:text-red-700" aria-label={`Leave ${doc.title}`} onClick={() => onAction({ type: "leave", doc })}>
                <UserMinus className="size-4" />
                Leave
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {[0, 1, 2].map((item) => (
        <div key={item} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="space-y-2">
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-3 w-36" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}
