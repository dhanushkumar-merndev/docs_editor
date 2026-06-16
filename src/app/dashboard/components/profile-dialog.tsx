import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TimeFormat, TimeZonePreference } from "@/lib/utils";
import { timeZones, type ProfileState } from "../dashboard-types";

// Lets a dashboard user edit display name and local time display preferences.
export function ProfileDialog({ profile, onClose, onSave, saving }: { profile: ProfileState; onClose: () => void; onSave: (profile: ProfileState) => void; saving?: boolean }) {
  const [draft, setDraft] = useState(profile);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Edit profile</h2>
        <div className="mt-4 space-y-4">
          <label className="block text-sm font-medium">
            Display name
            <Input className="mt-2" value={draft.displayName} onChange={(event) => setDraft({ ...draft, displayName: event.target.value })} />
          </label>
          <div className="block text-sm font-medium">
            Time format
            <Select value={draft.timeFormat} onValueChange={(val) => setDraft({ ...draft, timeFormat: val as TimeFormat })}>
              <SelectTrigger className="mt-2 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="center">
                <SelectItem value="12h">12-hour time</SelectItem>
                <SelectItem value="24h">24-hour time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="block text-sm font-medium">
            Timezone
            <Select value={draft.timeZone} onValueChange={(val) => setDraft({ ...draft, timeZone: val as TimeZonePreference })}>
              <SelectTrigger className="mt-2 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="center">
                {timeZones.map((zone) => (
                  <SelectItem key={zone.value} value={zone.value}>
                    {zone.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(draft)} disabled={saving} className="min-w-[100px]">
            {saving ? <Loader2 className="size-4 animate-spin mx-auto" /> : "Save profile"}
          </Button>
        </div>
      </div>
    </div>
  );
}
