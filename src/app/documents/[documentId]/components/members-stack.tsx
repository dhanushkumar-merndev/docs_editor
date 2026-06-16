"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getCollabColor } from "@/lib/collab-colors";
import { getRoleLabel } from "@/lib/permissions";
import type { DocumentMember } from "@/lib/types";

// Shows document members, presence dots, and a full member list dialog.
export function MembersStack({ members, activeUserIds }: { members: DocumentMember[]; activeUserIds: Set<string> }) {
  const max = 5;
  const visible = members.slice(0, max);
  const overflow = members.length - max;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="flex cursor-pointer items-center -space-x-2 hover:opacity-80" title="Document members">
          {visible.map((member) => (
            <div key={member.userId} className="relative rounded-full border-2 border-white dark:border-zinc-950">
              <Avatar name={member.name} />
              {activeUserIds.has(member.userId) ? (
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.18)] dark:border-zinc-950" />
              ) : null}
            </div>
          ))}
          {overflow > 0 ? (
            <div className="z-10 flex size-8 items-center justify-center rounded-full border-2 border-white bg-zinc-200 text-xs font-medium text-zinc-600 dark:border-zinc-950 dark:bg-zinc-700 dark:text-zinc-300">
              +{overflow}
            </div>
          ) : null}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Document members</DialogTitle>
        </DialogHeader>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {members.map((member) => (
            <div key={member.userId} className="flex items-center gap-3 py-2.5">
              <div className="relative shrink-0">
                <Avatar name={member.name} />
                {activeUserIds.has(member.userId) ? (
                  <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-950" />
                ) : (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white dark:border-zinc-950"
                    style={{ backgroundColor: getCollabColor(member.userId) }}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{member.name}</p>
                <p className="truncate text-xs text-zinc-500">{member.email}</p>
              </div>
              <Badge>{getRoleLabel(member.role)}</Badge>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
