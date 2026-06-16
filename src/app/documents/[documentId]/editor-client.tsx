"use client";

import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import type { Editor } from "@tiptap/core";
import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  ArrowLeft,
  Bold,
  Undo2,
  Redo2,
  Check,
  ChevronsUpDown,
  Download,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Moon,
  Share2,
  Sun,
  UnderlineIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAjaiaTheme } from "@/components/providers";
import { can, getRoleLabel } from "@/lib/permissions";
import type { AjaiaDocument, DocumentMember, MemberRole } from "@/lib/types";
import type { CurrentUser } from "@/lib/session";
import { useRealtimePointer, getColor } from "@/hooks/use-realtime-pointer";
import { PointerOverlay } from "@/components/pointer-overlay";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type SaveState = "saved" | "dirty" | "saving" | "error";
type EditorDocument = AjaiaDocument & { role: MemberRole };

const pageWidthClass: Record<EditorDocument["pageSize"], string> = {
  a4: "max-w-[794px]",
  letter: "max-w-[816px]",
  custom: "max-w-[900px]",
};

function renderInline(node: JSONContent): string {
  if (node.type === "text") {
    let text = node.text ?? "";
    for (const mark of node.marks ?? []) {
      if (mark.type === "bold") text = `**${text}**`;
      if (mark.type === "italic") text = `*${text}*`;
      if (mark.type === "strike") text = `~~${text}~~`;
      if (mark.type === "code") text = `\`${text}\``;
      if (mark.type === "link") text = `[${text}](${String(mark.attrs?.href ?? "")})`;
    }
    return text;
  }
  if (node.type === "hardBreak") return "\n";
  return (node.content ?? []).map(renderInline).join("");
}

function inlineText(node: JSONContent): string {
  return (node.content ?? []).map(renderInline).join("");
}

function tiptapToMarkdown(node: JSONContent | undefined): string {
  if (!node) return "";
  if (node.type === "doc") return (node.content ?? []).map(tiptapToMarkdown).filter(Boolean).join("\n\n").trim();
  if (node.type === "paragraph") return inlineText(node);
  if (node.type === "heading") return `${"#".repeat(Number(node.attrs?.level ?? 1))} ${inlineText(node)}`;
  if (node.type === "bulletList") return (node.content ?? []).map(renderListItem).join("\n");
  if (node.type === "orderedList") return (node.content ?? []).map((item, i) => renderListItem(item, i + 1)).join("\n");
  if (node.type === "listItem") return renderListItem(node);
  if (node.type === "codeBlock") {
    const lang = String(node.attrs?.language ?? "");
    return `\`\`\`${lang}\n${inlineText(node)}\n\`\`\``;
  }
  if (node.type === "blockquote") {
    const inner = (node.content ?? []).map(tiptapToMarkdown).join("\n");
    return inner.split("\n").map((l) => `> ${l}`).join("\n");
  }
  if (node.type === "horizontalRule") return "---";
  if (node.type === "image") return `![${String(node.attrs?.alt ?? "image")}](${String(node.attrs?.src ?? "")})`;
  if (node.type === "table") {
    const rows = (node.content ?? []).map((row) => {
      const cells = (row.content ?? []).map((cell) => ` ${inlineText(cell)} `);
      return `|${cells.join("|")}|`;
    });
    if (rows.length >= 2) {
      const colCount = rows[0].split("|").length - 2;
      rows.splice(1, 0, `|${Array(colCount).fill("---").join("|")}|`);
    }
    return rows.join("\n");
  }
  if (node.type === "taskList") return (node.content ?? []).map(renderTaskItem).join("\n");
  if (node.type === "taskItem") return renderTaskItem(node);
  return inlineText(node);
}

function renderListItem(item: JSONContent, index?: number) {
  const prefix = index != null ? `${index}.` : "-";
  const blocks = item.content ?? [];
  const lines: string[] = [];
  for (const block of blocks) {
    if (block.type === "paragraph") {
      lines.push(inlineText(block));
    } else {
      const nested = tiptapToMarkdown(block);
      if (nested) lines.push(nested.split("\n").map((l) => `  ${l}`).join("\n"));
    }
  }
  return `${prefix} ${lines.join("\n  ")}`;
}

function renderTaskItem(item: JSONContent) {
  const checked = item.attrs?.checked ? "x" : " ";
  const text = inlineText(item);
  return `- [${checked}] ${text}`;
}

export function EditorClient({ initialDocument, user }: { initialDocument: EditorDocument | null; user: CurrentUser }) {
  const [doc, setDoc] = useState<EditorDocument | null>(initialDocument);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [titleDraft, setTitleDraft] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const applyingRemoteUpdateRef = useRef(false);
  const saveStateRef = useRef<SaveState>("saved");
  const updatedAtRef = useRef(initialDocument?.updatedAt ?? "");
  const editingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const role = doc?.role ?? null;
  const editable = can(role, "edit");

  useEffect(() => {
    const id = window.setTimeout(() => setTitleDraft(doc?.title ?? ""), 0);
    return () => window.clearTimeout(id);
  }, [doc?.title]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ link: false, underline: false }),
        Underline.configure(),
        LinkExtension.configure({ openOnClick: false }),
        Placeholder.configure({ placeholder: "Start writing..." }),
      ],
      content: doc?.content,
      editable,
      immediatelyRender: false,
      onUpdate: () => {
        if (!applyingRemoteUpdateRef.current) {
          setSaveState("dirty");
          if (livePointersEnabled) {
            trackEditingRef.current(true);
            if (editingTimerRef.current) clearTimeout(editingTimerRef.current);
            editingTimerRef.current = setTimeout(() => trackEditingRef.current(false), 2000);
          }
        }
      },
    },
    [doc?.id, editable],
  );

  useEffect(() => {
    saveStateRef.current = saveState;
  }, [saveState]);

  useEffect(() => {
    if (doc?.updatedAt) updatedAtRef.current = doc.updatedAt;
  }, [doc?.updatedAt]);

  const previewMarkdown = editor && doc ? tiptapToMarkdown(editor.getJSON()) : "";

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  const livePointersEnabled = doc?.members && doc.members.length > 1;
  const editorCanvasRef = useRef<HTMLDivElement>(null);
  const { remotePointers, trackPointer, trackEditing } = useRealtimePointer(
    doc?.id ?? "",
    user.id,
    user.name,
  );
  const trackEditingRef = useRef(trackEditing);
  trackEditingRef.current = trackEditing;

  useEffect(() => {
    if (!livePointersEnabled) return;
    const el = editorCanvasRef.current;
    if (!el) return;
    function onMouseMove(event: MouseEvent) {
      const rect = editorCanvasRef.current!.getBoundingClientRect();
      trackPointer(event.clientX - rect.left, event.clientY - rect.top);
    }
    el.addEventListener("mousemove", onMouseMove);
    return () => el.removeEventListener("mousemove", onMouseMove);
  }, [livePointersEnabled, trackPointer]);

  const saveContent = useCallback(
    async (silent = false) => {
      if (!editor || !doc) return;
      if (!can(role, "edit")) {
        toast.error("You only have view access");
        return;
      }
      const content = editor.getJSON() as AjaiaDocument["content"];
      setSaveState("saving");
      try {
        const response = await fetch(`/api/documents/${doc.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "save", content }),
        });
        const data = (await response.json()) as { error?: string; updatedAt?: string };
        if (!response.ok) throw new Error(data.error ?? "Save failed");
        const nextUpdatedAt = data.updatedAt ?? new Date().toISOString();
        updatedAtRef.current = nextUpdatedAt;
        setDoc((current) => (current ? { ...current, content, updatedAt: nextUpdatedAt } : current));
        setSaveState("saved");
        if (!silent) toast.success("Document saved");
      } catch (error) {
        setSaveState("error");
        toast.error(error instanceof Error ? error.message : "Save failed");
      }
    },
    [doc, editor, role],
  );

  useEffect(() => {
    if (!editable || saveState !== "dirty") return;
    const id = window.setTimeout(() => void saveContent(true), 1200);
    return () => window.clearTimeout(id);
  }, [editable, saveContent, saveState]);

  useEffect(() => {
    if (!doc || !editor) return;
    const id = window.setInterval(() => {
      if (saveStateRef.current !== "saved") return;
      fetch(`/api/documents/${doc.id}`)
        .then(async (response) => {
          const data = (await response.json()) as { document?: EditorDocument };
          if (!response.ok || !data.document) return;
          if (Date.parse(data.document.updatedAt) <= Date.parse(updatedAtRef.current)) return;
          applyingRemoteUpdateRef.current = true;
          editor.commands.setContent(data.document.content, { emitUpdate: false });
          applyingRemoteUpdateRef.current = false;
          updatedAtRef.current = data.document.updatedAt;
          setDoc(data.document);
          setSaveState("saved");
        })
        .catch(() => {
          applyingRemoteUpdateRef.current = false;
        });
    }, 5000);
    return () => window.clearInterval(id);
  }, [doc, editor]);

  if (!doc || !role) {
    return (
      <main className="grid min-h-dvh place-items-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Document not found</h1>
          <p className="mt-2 text-zinc-500">It may not exist, or your account does not have access.</p>
          <Link className="mt-5 inline-flex" href="/dashboard">
            <Button>Back to dashboard</Button>
          </Link>
        </div>
      </main>
    );
  }

  function rename() {
    if (!doc) return;
    if (!can(role, "rename")) {
      setTitleDraft(doc.title);
      toast.error("Only owners can rename this document");
      return;
    }
    const nextTitle = titleDraft.trim();
    if (!nextTitle || nextTitle.length > 120) {
      toast.error("Title must be 1-120 characters");
      setTitleDraft(doc.title);
      return;
    }
    if (nextTitle !== doc.title) {
      fetch(`/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "rename", title: nextTitle }),
      })
        .then(async (response) => {
          const data = (await response.json()) as { error?: string };
          if (!response.ok) throw new Error(data.error ?? "Rename failed");
          setDoc((current) => (current ? { ...current, title: nextTitle } : current));
        })
        .catch((error: Error) => {
          toast.error(error.message);
          setTitleDraft(doc.title);
        });
    }
  }

  function exportMarkdown() {
    if (!editor || !doc) return;
    const markdown = tiptapToMarkdown(editor.getJSON());
    const blob = new Blob([markdown || `# ${doc.title}\n`], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${doc.title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "ajaia-document"}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-dvh bg-zinc-100 dark:bg-zinc-950">
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
                onBlur={rename}
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
              <MembersStack members={doc?.members ?? []} />
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
                  <ThemeToggleInDropdown />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <Toolbar editor={editor} disabled={!editable} className="justify-center" />
        </div>
      </header>

      <section className="px-3 py-8 lg:px-8">
        <div className={`flex gap-6 transition-all duration-300 ${previewOpen ? "" : "justify-center"}`}>
          <div className={`relative transition-all duration-300 ease-out ${previewOpen ? "w-1/2 min-w-0" : `w-full ${pageWidthClass[doc.pageSize]}`}`}>
            <div ref={editorCanvasRef} className="rounded-lg bg-white p-8 shadow-sm dark:bg-zinc-900 md:p-12">
              <EditorContent editor={editor} />
              <PointerOverlay pointers={remotePointers} />
            </div>
          </div>
          {previewOpen ? (
            <div className="w-1/2 min-w-0" style={{ animation: "fadeIn 0.3s ease-out" }}>
              <div className="rounded-lg bg-zinc-50 p-8 shadow-sm dark:bg-zinc-900 md:p-12">
                <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                  {previewMarkdown}
                </pre>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {shareOpen ? <ShareDialog doc={doc} onClose={() => setShareOpen(false)} onDocumentChange={setDoc} /> : null}
    </main>
  );
}

function Toolbar({
  editor,
  disabled,
  className,
}: {
  editor: Editor | null;
  disabled: boolean;
  className?: string;
}) {
  const buttons = [
    { icon: Undo2, label: "Undo", run: () => editor?.chain().focus().undo().run(), active: false },
    { icon: Redo2, label: "Redo", run: () => editor?.chain().focus().redo().run(), active: false },
    { icon: null, label: "sep1", separator: true },
    { icon: Bold, label: "Bold", run: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive("bold") },
    { icon: Italic, label: "Italic", run: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive("italic") },
    { icon: UnderlineIcon, label: "Underline", run: () => editor?.chain().focus().toggleUnderline().run(), active: editor?.isActive("underline") },
    { icon: Heading1, label: "H1", run: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), active: editor?.isActive("heading", { level: 1 }) },
    { icon: Heading2, label: "H2", run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active: editor?.isActive("heading", { level: 2 }) },
    { icon: Heading3, label: "H3", run: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), active: editor?.isActive("heading", { level: 3 }) },
    { icon: List, label: "Bullets", run: () => editor?.chain().focus().toggleBulletList().run(), active: editor?.isActive("bulletList") },
    { icon: ListOrdered, label: "Numbers", run: () => editor?.chain().focus().toggleOrderedList().run(), active: editor?.isActive("orderedList") },
  ];
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      {buttons.map((item) =>
        item.separator ? (
          <div key={item.label} className="h-5 w-px bg-zinc-300 dark:bg-zinc-700" />
        ) : (
          <Button key={item.label} type="button" variant={item.active ? "secondary" : "ghost"} size="icon" disabled={disabled || !editor} title={item.label} onClick={item.run}>
            {item.icon ? <item.icon className="size-4" /> : null}
          </Button>
        )
      )}
    </div>
  );
}

function ThemeToggleInDropdown() {
  const { mounted, theme, setTheme } = useAjaiaTheme();
  const isDark = mounted && theme === "dark";
  return (
    <DropdownMenuItem onClick={() => setTheme(isDark ? "light" : "dark")}>
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {isDark ? "Light mode" : "Dark mode"}
    </DropdownMenuItem>
  );
}

function SaveStateBadge({ state }: { state: SaveState }) {
  const text = state === "dirty" ? "Unsaved changes" : state === "saving" ? "Saving..." : state === "error" ? "Save failed" : "Saved";
  return (
    <Badge className={state === "dirty" ? "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200" : ""}>
      {state === "saved" ? <Check className="mr-1 size-3" /> : null}
      {text}
    </Badge>
  );
}

function ShareDialog({ doc, onClose, onDocumentChange }: { doc: EditorDocument; onClose: () => void; onDocumentChange: (doc: EditorDocument) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ id: string; name: string; email: string } | null>(null);
  const [results, setResults] = useState<{ id: string; name: string; email: string; image: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Exclude<MemberRole, "owner">>("viewer");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (search.length < 2) {
      return;
    }
    const id = setTimeout(async () => {
      setLoading(true);
      setResults([]);
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(search)}`);
        if (response.ok) {
          const data = (await response.json()) as { users: { id: string; name: string; email: string; image: string | null }[] };
          setResults(data.users);
        } else {
          const data = (await response.json()) as { error?: string };
          if (response.status !== 429) setResults([]);
          if (response.status === 429) toast.error(data.error ?? "Too many requests");
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    debounceRef.current = id;
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  function handleShare() {
    if (!selected) {
      toast.error("Select a registered user from the list");
      return;
    }
    fetch(`/api/documents/${doc.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "shareEmail", email: selected.email, role }),
    })
      .then(async (response) => {
        const data = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(data.error ?? "Share failed");
        toast.success("Document shared");
        setSelected(null);
        setSearch("");
        setOpen(false);
        const fresh = await fetch(`/api/documents/${doc.id}`);
        const freshData = (await fresh.json()) as { document?: EditorDocument };
        if (freshData.document) onDocumentChange(freshData.document);
      })
      .catch((error: Error) => toast.error(error.message));
  }

  const alreadyMembers = new Set(doc.members.map((m) => m.userId));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-lg border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Share document</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30">
            <X className="size-4" />
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                  {selected ? (
                    <span className="truncate">{selected.name} ({selected.email})</span>
                  ) : (
                    <span className="text-muted-foreground">Search registered users...</span>
                  )}
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Type name or email..." value={search} onValueChange={setSearch} />
                  <CommandList>
                    <CommandEmpty>{loading ? "Searching..." : "No registered user found"}</CommandEmpty>
                    <CommandGroup>
                      {results.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={user.email}
                          disabled={alreadyMembers.has(user.id)}
                          onSelect={(currentValue) => {
                            const found = results.find((u) => u.email === currentValue);
                            if (found) {
                              setSelected(found);
                              setOpen(false);
                            }
                          }}
                        >
                          <Avatar name={user.name} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{user.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                          </div>
                          {alreadyMembers.has(user.id) ? (
                            <span className="text-xs text-muted-foreground">Already member</span>
                          ) : selected?.id === user.id ? (
                            <Check className="size-4" />
                          ) : null}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <Select value={role} onValueChange={(val) => setRole(val as Exclude<MemberRole, "owner">)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">Viewer</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleShare} disabled={!selected}>Invite</Button>
        </div>
        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold">Current members</p>
          <div className="max-h-[168px] overflow-y-auto divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {doc.members.map((member) => (
              <div key={member.userId} className="flex items-center gap-3 p-3">
                <Avatar name={member.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{member.name}</p>
                  <p className="truncate text-xs text-zinc-500">{member.email}</p>
                </div>
                <Badge>{getRoleLabel(member.role)}</Badge>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 text-xs text-zinc-500">Transfer ownership is documented as a stretch feature and intentionally left out of this MVP workflow.</p>
      </div>
    </div>
  );
}

function MembersStack({ members }: { members: DocumentMember[] }) {
  const max = 3;
  const visible = members.slice(0, max);
  const overflow = members.length - max;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="flex cursor-pointer items-center -space-x-2 hover:opacity-80">
          {visible.map((member) => (
            <div key={member.userId} className="rounded-full border-2 border-white dark:border-zinc-950">
              <Avatar name={member.name} />
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
                <span
                  className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white dark:border-zinc-950"
                  style={{ backgroundColor: getColor(member.userId) }}
                />
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
