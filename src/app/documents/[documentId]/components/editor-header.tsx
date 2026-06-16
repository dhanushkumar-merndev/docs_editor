"use client";

import {
  ArrowLeft,
  Bold,
  ChevronDown,
  Download,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  MoreVertical,
  Redo2,
  Share2,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { can } from "@/lib/permissions";
import type { CurrentUser } from "@/lib/session";
import { MembersStack } from "./members-stack";
import { SaveStateBadge } from "./save-state-badge";
import { ThemeToggleDropdownItem } from "./theme-toggle-dropdown-item";
import type { EditorDocument, PreviewMode, SaveState } from "./editor-types";

/** Toolbar icon button with a shadcn Tooltip — replaces the native `title` attribute. */
function TipBtn({
  label,
  onClick,
  active = false,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? "secondary" : "ghost"}
          size="icon"
          aria-label={label}
          aria-pressed={active}
          onClick={onClick}
          className={active ? "bg-zinc-200 dark:bg-zinc-700" : ""}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

// Renders the document editor top bar with navigation, title, sharing, preview, export, and user controls.
export function EditorHeader({
  activeFormats,
  activeUserIds,
  doc,
  editable,
  exportMarkdown,
  onFormat,
  onDocumentChange,
  previewMode,
  previewOpen,
  renameDocument,
  role,
  saveState,
  setPreviewMode,
  setPreviewOpen,
  setShareOpen,
  setTitleDraft,
  titleDraft,
  user,
}: {
  activeFormats: Set<string>;
  activeUserIds: Set<string>;
  doc: EditorDocument;
  editable: boolean;
  exportMarkdown: () => void;
  onFormat: (kind: "bold" | "italic" | "h1" | "h2" | "h3" | "bullet" | "numbered" | "undo" | "redo") => void;
  onDocumentChange: (doc: EditorDocument) => void;
  previewMode: PreviewMode;
  previewOpen: boolean;
  renameDocument: () => void;
  role: EditorDocument["role"];
  saveState: SaveState;
  setPreviewMode: (mode: PreviewMode) => void;
  setPreviewOpen: (open: boolean) => void;
  setShareOpen: (open: boolean) => void;
  setTitleDraft: (title: string) => void;
  titleDraft: string;
  user: CurrentUser;
}) {
  return (
    <TooltipProvider delayDuration={400}>
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="flex flex-col gap-3 px-3 py-3 lg:px-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 w-full">
            {/* Left: Navigation and Document Title */}
            <div className="flex items-center justify-start gap-2 min-w-0">
              <Link href="/dashboard">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Back to dashboard">
                      <ArrowLeft className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Back</TooltipContent>
                </Tooltip>
              </Link>
              <div className="flex items-center gap-2 min-w-0">
                {/* Dynamic-width input: grows/shrinks with character count accurately using an inline-grid */}
                <div className="relative inline-grid min-w-[60px] max-w-[260px] items-center">
                  <span className="invisible col-start-1 row-start-1 px-1.5 text-left text-lg font-semibold whitespace-pre">
                    {titleDraft || "Untitled"}
                  </span>
                  <Input
                    className="col-start-1 row-start-1 h-9 w-full border-transparent bg-transparent px-1.5 text-left text-lg font-semibold focus:border-zinc-300 dark:focus:border-zinc-700"
                    value={titleDraft}
                    onChange={(event) => setTitleDraft(event.target.value)}
                    onBlur={renameDocument}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") event.currentTarget.blur();
                    }}
                    readOnly={!can(role, "rename")}
                    maxLength={20}
                    aria-label="Document title"
                  />
                </div>
                <SaveStateBadge state={saveState} />
              </div>
            </div>

            {/* Center: Formatting Toolbar */}
            <div className="flex items-center justify-center">
              {editable ? (
                <div className="flex items-center gap-0.5 rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950">
                  <TipBtn label="Undo" onClick={() => onFormat("undo")}>
                    <Undo2 className="size-4" />
                  </TipBtn>
                  <TipBtn label="Redo" onClick={() => onFormat("redo")}>
                    <Redo2 className="size-4" />
                  </TipBtn>
                  <div className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
                  <TipBtn label="Bold" active={activeFormats.has("bold")} onClick={() => onFormat("bold")}>
                    <Bold className="size-4" />
                  </TipBtn>
                  <TipBtn label="Italic" active={activeFormats.has("italic")} onClick={() => onFormat("italic")}>
                    <Italic className="size-4" />
                  </TipBtn>
                  <div className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
                  <TipBtn label="Heading 1" active={activeFormats.has("h1")} onClick={() => onFormat("h1")}>
                    <Heading1 className="size-4" />
                  </TipBtn>
                  <TipBtn label="Heading 2" active={activeFormats.has("h2")} onClick={() => onFormat("h2")}>
                    <Heading2 className="size-4" />
                  </TipBtn>
                  <TipBtn label="Heading 3" active={activeFormats.has("h3")} onClick={() => onFormat("h3")}>
                    <Heading3 className="size-4" />
                  </TipBtn>
                  <div className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
                  <TipBtn label="Bullet list" active={activeFormats.has("bullet")} onClick={() => onFormat("bullet")}>
                    <List className="size-4" />
                  </TipBtn>
                  <TipBtn label="Numbered list" active={activeFormats.has("numbered")} onClick={() => onFormat("numbered")}>
                    <ListOrdered className="size-4" />
                  </TipBtn>
                </div>
              ) : null}
            </div>

            {/* Right: Actions, Share, Export, Preview, Profile */}
            <div className="flex items-center justify-end gap-2 min-w-0">
              <MembersStack
                members={doc.members}
                activeUserIds={activeUserIds}
                isOwner={role === "owner"}
                documentId={doc.id}
                onMembersChange={(members) => onDocumentChange({ ...doc, members })}
              />
              <Button
                variant="outline"
                onClick={() =>
                  can(role, "share") ? setShareOpen(true) : toast.error("Only owners can share this document")
                }
              >
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
              {previewOpen ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-[116px] justify-between">
                      <span>{previewMode === "markdown" ? "Markdown" : "Plain"}</span>
                      <ChevronDown className="size-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="end" className="w-[116px]">
                    <DropdownMenuItem onClick={() => setPreviewMode("markdown")}>Markdown</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPreviewMode("plain")}>Plain</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" aria-label="User settings">
                    <MoreVertical className="size-4" />
                  </Button>
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
    </TooltipProvider>
  );
}
