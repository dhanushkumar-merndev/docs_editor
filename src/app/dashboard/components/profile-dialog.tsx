import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TimeFormat, TimeZonePreference } from "@/lib/utils";
import { timeZones, type ProfileState } from "../dashboard-types";

// Lets a dashboard user edit display name and local time display preferences.
export function ProfileDialog({ profile, onClose, onSave }: { profile: ProfileState; onClose: () => void; onSave: (profile: ProfileState) => void }) {
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
          <label className="block text-sm font-medium">
            Time format
            <select
              className="mt-2 h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              value={draft.timeFormat}
              onChange={(event) => setDraft({ ...draft, timeFormat: event.target.value as TimeFormat })}
            >
              <option value="12h">12-hour time</option>
              <option value="24h">24-hour time</option>
            </select>
          </label>
          <label className="block text-sm font-medium">
            Timezone
            <select
              className="mt-2 h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              value={draft.timeZone}
              onChange={(event) => setDraft({ ...draft, timeZone: event.target.value as TimeZonePreference })}
            >
              {timeZones.map((zone) => (
                <option key={zone.value} value={zone.value}>
                  {zone.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(draft)}>Save profile</Button>
        </div>
      </div>
    </div>
  );
}
