"use client";

import { ArrowLeft, Download, Eye, Share2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { can } from "@/lib/permissions";
import type { CurrentUser } from "@/lib/session";
import { MembersStack } from "./members-stack";
import { SaveStateBadge } from "./save-state-badge";
import { ThemeToggleDropdownItem } from "./theme-toggle-dropdown-item";
import type { EditorDocument, SaveState } from "./editor-types";

// Renders the document editor top bar with navigation, title, sharing, preview, export, and user controls.
export function EditorHeader({
  activeUserIds,
  doc,
  exportMarkdown,
  previewOpen,
  renameDocument,
  role,
  saveState,
  setPreviewOpen,
  setShareOpen,
  setTitleDraft,
  titleDraft,
  user,
}: {
  activeUserIds: Set<string>;
  doc: EditorDocument;
  exportMarkdown: () => void;
  previewOpen: boolean;
  renameDocument: () => void;
  role: EditorDocument["role"];
  saveState: SaveState;
  setPreviewOpen: (open: boolean) => void;
  setShareOpen: (open: boolean) => void;
  setTitleDraft: (title: string) => void;
  titleDraft: string;
  user: CurrentUser;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="flex flex-col gap-3 px-4 py-3 lg:px-6">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" title="Back">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div className="flex items-center justify-start gap-2">
            <Input
              className="h-9 max-w-[200px] border-transparent bg-transparent px-2 text-left text-lg font-semibold focus:border-zinc-300 dark:focus:border-zinc-700"
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              onBlur={renameDocument}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              readOnly={!can(role, "rename")}
              maxLength={20}
              title={can(role, "rename") ? "Rename document" : "Only owner can rename"}
            />
            <SaveStateBadge state={saveState} />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <MembersStack members={doc.members} activeUserIds={activeUserIds} />
            <Button variant="outline" onClick={() => (can(role, "share") ? setShareOpen(true) : toast.error("Only owners can share this document"))}>
              <Share2 className="size-4" />
              Share
            </Button>
            <Button variant="outline" onClick={exportMarkdown}>
              <Download className="size-4" />
              Export
            </Button>
            <Button variant={previewOpen ? "secondary" : "outline"} onClick={() => setPreviewOpen(!previewOpen)}>
              <Eye className="size-4" />
              Preview
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="cursor-pointer rounded-full border-2 border-white dark:border-zinc-950">
                  <Avatar name={user.name} src={user.image ?? undefined} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" className="w-56">
                <DropdownMenuLabel>
                  <span className="block truncate text-sm font-medium">{user.name}</span>
                  <span className="block truncate text-xs font-normal text-zinc-500">{user.email}</span>
                  {doc.ownerId === user.id ? (
                    <span className="mt-0.5 block text-xs font-medium text-amber-600 dark:text-amber-400">Owner</span>
                  ) : null}
                </DropdownMenuLabel>
                {doc.ownerId !== user.id ? (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5">
                      <p className="text-xs font-medium text-zinc-500">Owner</p>
                      <p className="truncate text-sm">{doc.ownerName}</p>
                      <p className="truncate text-xs text-zinc-500">{doc.ownerEmail}</p>
                    </div>
                  </>
                ) : null}
                <DropdownMenuSeparator />
                <ThemeToggleDropdownItem />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
