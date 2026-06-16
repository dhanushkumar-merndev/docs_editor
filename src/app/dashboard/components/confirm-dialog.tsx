import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PendingAction } from "../dashboard-types";

// Confirms destructive dashboard actions such as deleting or leaving a document.
export function ConfirmDialog({
  pendingAction,
  loading,
  onCancel,
  onConfirm,
}: {
  pendingAction: Exclude<PendingAction, null>;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isDelete = pendingAction.type === "delete";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">{isDelete ? "Delete document?" : "Leave shared document?"}</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {isDelete
            ? `This will permanently delete "${pendingAction.doc.title}" for everyone.`
            : `This will revoke your access to "${pendingAction.doc.title}".`}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant={isDelete ? "danger" : "primary"} onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            {isDelete ? "Delete" : "Leave"}
          </Button>
        </div>
      </div>
    </div>
  );
}
