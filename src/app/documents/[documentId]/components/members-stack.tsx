"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { getRoleLabel } from "@/lib/permissions";
import type { DocumentMember, MemberRole } from "@/lib/types";
import { Loader2, MoreVertical } from "lucide-react";

// Shows active member avatars in the header; opens a full member list dialog with role management.
export function MembersStack({
  members,
  activeUserIds,
  isOwner = false,
  documentId,
  onMembersChange,
}: {
  members: DocumentMember[];
  activeUserIds: Set<string>;
  isOwner?: boolean;
  documentId: string;
  onMembersChange?: (members: DocumentMember[]) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const max = 5;
  // Header button: only show active members
  const activeMembers = members.filter((m) => activeUserIds.has(m.userId));
  const visible = activeMembers.slice(0, max);
  const overflow = activeMembers.length - max;

  async function handleRoleChange(userId: string, newRole: MemberRole) {
    if (newRole === "owner") return;
    setBusy(userId);
    try {
      const res = await fetch(`/api/documents/${documentId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to update role"); return; }
      toast.success("Role updated");
      onMembersChange?.(members.map((m) => (m.userId === userId ? { ...m, role: newRole } : m)));
    } catch { toast.error("Failed to update role"); }
    finally { setBusy(null); }
  }

  async function handleRemove(userId: string) {
    setBusy(userId);
    try {
      const res = await fetch(`/api/documents/${documentId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to remove member"); return; }
      toast.success("Member removed");
      onMembersChange?.(members.filter((m) => m.userId !== userId));
    } catch { toast.error("Failed to remove member"); }
    finally { setBusy(null); }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="flex cursor-pointer items-center -space-x-2 hover:opacity-80" aria-label="Document members">
          {visible.length === 0 ? (
            <span className="text-xs text-zinc-400">No one online</span>
          ) : (
            visible.map((member) => (
              <div key={member.userId} className="relative rounded-full border-2 border-white dark:border-zinc-900">
                <Avatar name={member.name} src={member.image ?? undefined} />
              </div>
            ))
          )}
          {overflow > 0 ? (
            <div className="z-10 flex size-8 items-center justify-center rounded-full border-2 border-white bg-zinc-200 text-xs font-medium text-zinc-600 dark:border-zinc-900 dark:bg-zinc-700 dark:text-zinc-300">
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
                <Avatar name={member.name} src={member.image ?? undefined} />
                {activeUserIds.has(member.userId) ? (
                  <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-900" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{member.name}</p>
                <p className="truncate text-xs text-zinc-500">{member.email}</p>
              </div>
              {member.role === "owner" ? (
                <Badge>Owner</Badge>
              ) : isOwner ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-full"
                      disabled={busy === member.userId}
                      aria-label={`Manage ${member.name}`}
                    >
                      {busy === member.userId ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <MoreVertical className="size-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(member.userId, "editor")}
                      disabled={member.role === "editor"}
                      className="flex items-center justify-between text-xs"
                    >
                      <span>Editor</span>
                      {member.role === "editor" && <span className="size-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(member.userId, "viewer")}
                      disabled={member.role === "viewer"}
                      className="flex items-center justify-between text-xs"
                    >
                      <span>Viewer</span>
                      {member.role === "viewer" && <span className="size-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleRemove(member.userId)}
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive text-xs"
                    >
                      Remove user
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Badge className="bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                  {getRoleLabel(member.role)}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
