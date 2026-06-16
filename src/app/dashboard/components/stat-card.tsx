import { Skeleton } from "@/components/ui/skeleton";

// Displays a clickable dashboard metric card.
export function StatCard({ label, value, loading, onClick }: { label: string; value: number; loading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className="rounded-lg border border-zinc-200 bg-white p-4 text-left transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
      onClick={onClick}
    >
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      {loading ? <Skeleton className="mt-3 h-8 w-16" /> : <p className="mt-2 text-3xl font-semibold">{value}</p>}
    </button>
  );
}
