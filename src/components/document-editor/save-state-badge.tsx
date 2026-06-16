import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SaveState } from "./editor-types";

// Renders the compact save-state indicator shown in the editor header.
export function SaveStateBadge({ state }: { state: SaveState }) {
  const text = state === "dirty" ? "Unsaved changes" : state === "saving" ? "Saving..." : state === "error" ? "Save failed" : "Saved";
  return (
    <Badge className={state === "dirty" ? "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200" : ""}>
      {state === "saved" ? <Check className="mr-1 size-3" /> : null}
      {text}
    </Badge>
  );
}
