"use client";

import ImageExtension from "@tiptap/extension-image";
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
  Check,
  ChevronDown,
  ChevronsUpDown,
  Download,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Plus,
  Share2,
  Trash2,
  UnderlineIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ThemeToggle } from "@/components/theme-toggle";
import { imageSizeLimitLabel, MAX_IMAGES_PER_DOCUMENT, MAX_IMAGE_SIZE_BYTES } from "@/lib/limits";
import { can, getRoleLabel } from "@/lib/permissions";
import type { AjaiaDocument, MemberRole, PageSize } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type SaveState = "saved" | "dirty" | "saving" | "error";
type EditorDocument = AjaiaDocument & { role: MemberRole };

const pageStyles: Record<PageSize, string> = {
  a4: "max-w-[794px]",
  letter: "max-w-[816px]",
  custom: "max-w-[920px]",
};

const pageLabels: Record<PageSize, string> = {
  a4: "A4",
  letter: "Letter",
  custom: "Custom",
};

const pageHeights: Record<PageSize, number> = {
  a4: 1123,
  letter: 1056,
  custom: 980,
};

function countImages(content: JSONContent | JSONContent[] | undefined): number {
  if (!content) return 0;
  if (Array.isArray(content)) return content.reduce((total, node) => total + countImages(node), 0);
  const current = content.type === "image" ? 1 : 0;
  return current + countImages(content.content);
}

function plainText(nodes: JSONContent[] | undefined): string {
  return (nodes ?? []).map((node) => node.text ?? plainText(node.content)).join("");
}

function tiptapToMarkdown(node: JSONContent | undefined): string {
  if (!node) return "";
  if (node.type === "doc") return (node.content ?? []).map(tiptapToMarkdown).join("\n\n").trim();
  if (node.type === "paragraph") return plainText(node.content);
  if (node.type === "heading") return `${"#".repeat(Number(node.attrs?.level ?? 1))} ${plainText(node.content)}`;
  if (node.type === "bulletList") return (node.content ?? []).map((item) => `- ${plainText(item.content?.[0]?.content)}`).join("\n");
  if (node.type === "orderedList") return (node.content ?? []).map((item, index) => `${index + 1}. ${plainText(item.content?.[0]?.content)}`).join("\n");
  if (node.type === "image") return `![${String(node.attrs?.alt ?? "image")}](${String(node.attrs?.src ?? "")})`;
  return plainText(node.content);
}

async function imageFileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function EditorClient({ initialDocument }: { initialDocument: EditorDocument | null }) {
  const [doc, setDoc] = useState<EditorDocument | null>(initialDocument);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [titleDraft, setTitleDraft] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const [deletePageOpen, setDeletePageOpen] = useState(false);
  const applyingRemoteUpdateRef = useRef(false);
  const saveStateRef = useRef<SaveState>("saved");
  const updatedAtRef = useRef(initialDocument?.updatedAt ?? "");
  const role = doc?.role ?? null;
  const editable = can(role, "edit");

  useEffect(() => {
    const id = window.setTimeout(() => setTitleDraft(doc?.title ?? ""), 0);
    return () => window.clearTimeout(id);
  }, [doc?.title]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Underline,
        ImageExtension.configure({ inline: false, allowBase64: true }),
        LinkExtension.configure({ openOnClick: false }),
        Placeholder.configure({ placeholder: "Start writing..." }),
      ],
      content: doc?.content,
      editable,
      immediatelyRender: false,
      onUpdate: () => {
        if (!applyingRemoteUpdateRef.current) setSaveState("dirty");
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

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  const activeMembers = doc?.members.slice(0, 4) ?? [];

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

  async function uploadImage(file: File | undefined) {
    if (!file || !editor || !doc) return;
    if (!can(role, "uploadImage")) {
      toast.error("You only have view access");
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Unsupported file type");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error(`Image must be under ${imageSizeLimitLabel()}`);
      return;
    }
    if (countImages(editor.getJSON()) >= MAX_IMAGES_PER_DOCUMENT) {
      toast.error("This document already has 60 images");
      return;
    }
    const src = await imageFileToDataUrl(file);
    editor.chain().focus().setImage({ src, alt: file.name }).run();
    setSaveState("dirty");
    toast.success("Image inserted");
  }

  function updatePageSize(pageSize: PageSize) {
    if (!doc) return;
    setDoc({ ...doc, pageSize });
    void fetch(`/api/documents/${doc.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "pageSize", pageSize }),
    });
  }

  function updatePageCount(pageCount: number) {
    if (!doc) return;
    const nextPageCount = Math.max(1, Math.min(20, pageCount));
    setDoc({ ...doc, pageCount: nextPageCount });
    void fetch(`/api/documents/${doc.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "pageCount", pageCount: nextPageCount }),
    });
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
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" title="Back">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <Input
              className="h-9 max-w-md border-transparent bg-transparent px-2 text-lg font-semibold focus:border-zinc-300 dark:focus:border-zinc-700"
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              onBlur={rename}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              readOnly={!can(role, "rename")}
              title={can(role, "rename") ? "Rename document" : "Only owner can rename"}
            />
            <Badge>{getRoleLabel(role)}</Badge>
            <SaveStateBadge state={saveState} updatedAt={doc.updatedAt} />
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <div className="flex -space-x-2">
                {activeMembers.map((member) => (
                  <div key={member.userId} title={`${member.name} · ${member.role}`} className="rounded-full border-2 border-white dark:border-zinc-950">
                    <Avatar name={member.name} />
                  </div>
                ))}
              </div>
              <label className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium whitespace-nowrap transition-all hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50">
                <ImagePlus className="size-4" />
                Upload image
                <input className="sr-only" type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" onChange={(event) => uploadImage(event.target.files?.[0])} disabled={!can(role, "uploadImage")} />
              </label>
              <Button variant="outline" onClick={() => (can(role, "share") ? setShareOpen(true) : toast.error("Only owners can share this document"))}>
                <Share2 className="size-4" />
                Share
              </Button>
              <Button variant="outline" onClick={exportMarkdown}>
                <Download className="size-4" />
                Export
              </Button>
              <ThemeToggle />
            </div>
          </div>
          <Toolbar editor={editor} disabled={!editable} pageSize={doc.pageSize} pageSizeOpen={pageSizeOpen} onPageSizeOpen={setPageSizeOpen} onPageSize={updatePageSize} />
        </div>
      </header>

      <section className="px-3 py-8 lg:px-8">
        <div className="space-y-6">
          {Array.from({ length: doc.pageCount }).map((_, index) => (
            <div
              key={index}
              className={`relative mx-auto ${pageStyles[doc.pageSize]} bg-white p-8 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800 md:p-12`}
              style={{ minHeight: pageHeights[doc.pageSize] }}
            >
              <div className="absolute bottom-4 right-5 text-xs text-zinc-400">Page {index + 1}</div>
              {index === 0 ? <EditorContent editor={editor} /> : <div className="grid min-h-[820px] place-items-center text-sm text-zinc-300">Manual visual page</div>}
            </div>
          ))}
        </div>
        <PageControls
          disabled={!editable}
          pageCount={doc.pageCount}
          onAdd={() => updatePageCount(doc.pageCount + 1)}
          onAskDelete={() => setDeletePageOpen(true)}
        />
      </section>

      {shareOpen ? <ShareDialog doc={doc} onClose={() => setShareOpen(false)} onDocumentChange={setDoc} /> : null}
      {deletePageOpen ? (
        <DeletePageDialog
          onCancel={() => setDeletePageOpen(false)}
          onDelete={() => {
            updatePageCount(doc.pageCount - 1);
            setDeletePageOpen(false);
          }}
        />
      ) : null}
    </main>
  );
}

function PageControls({ disabled, pageCount, onAdd, onAskDelete }: { disabled: boolean; pageCount: number; onAdd: () => void; onAskDelete: () => void }) {
  return (
    <div className="mx-auto mt-5 flex max-w-[794px] items-center justify-center gap-2">
      <Button variant="outline" onClick={onAdd} disabled={disabled || pageCount >= 20}>
        <Plus className="size-4" />
        Add page
      </Button>
      {pageCount > 1 ? (
        <Button variant="danger" onClick={onAskDelete} disabled={disabled}>
          <Trash2 className="size-4" />
          Delete page
        </Button>
      ) : null}
    </div>
  );
}

function DeletePageDialog({ onCancel, onDelete }: { onCancel: () => void; onDelete: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Delete last page?</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">This removes the last visual page from the layout. The document text stays in the saved editor content.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onDelete}>Delete page</Button>
        </div>
      </div>
    </div>
  );
}

function Toolbar({
  editor,
  disabled,
  pageSize,
  pageSizeOpen,
  onPageSizeOpen,
  onPageSize,
}: {
  editor: Editor | null;
  disabled: boolean;
  pageSize: PageSize;
  pageSizeOpen: boolean;
  onPageSizeOpen: (open: boolean) => void;
  onPageSize: (size: PageSize) => void;
}) {
  const buttons = [
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
    <div className="flex flex-wrap items-center gap-2">
      {buttons.map((item) => (
        <Button key={item.label} type="button" variant={item.active ? "secondary" : "ghost"} size="icon" disabled={disabled || !editor} title={item.label} onClick={item.run}>
          <item.icon className="size-4" />
        </Button>
      ))}
      <div className="relative">
        <button
          type="button"
          className="inline-flex h-9 min-w-28 items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          onClick={() => onPageSizeOpen(!pageSizeOpen)}
        >
          {pageLabels[pageSize]}
          <ChevronDown className="size-4 text-zinc-400" />
        </button>
        {pageSizeOpen ? (
          <div className="absolute left-0 top-10 z-50 w-36 overflow-hidden rounded-md border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
            {(["a4", "letter", "custom"] as PageSize[]).map((size) => (
              <button
                key={size}
                type="button"
                className="flex h-8 w-full items-center rounded px-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                onClick={() => {
                  onPageSize(size);
                  onPageSizeOpen(false);
                }}
              >
                {pageLabels[size]}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SaveStateBadge({ state, updatedAt }: { state: SaveState; updatedAt: string }) {
  const text = state === "dirty" ? "Unsaved changes" : state === "saving" ? "Saving..." : state === "error" ? "Save failed" : `Saved ${formatDate(updatedAt)}`;
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
  const [link, setLink] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (search.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
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

  function handleLink() {
    fetch(`/api/documents/${doc.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "publicLink" }),
    })
      .then(async (response) => {
        const data = (await response.json()) as { token?: string; error?: string };
        if (!response.ok || !data.token) throw new Error(data.error ?? "Failed to create link");
        const url = `${window.location.origin}/share/${data.token}`;
        setLink(url);
        navigator.clipboard?.writeText(url).catch(() => undefined);
        toast.success("Public editor link copied");
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
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_130px_auto]">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={open} className="justify-between">
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
          <select className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-800" value={role} onChange={(event) => setRole(event.target.value as Exclude<MemberRole, "owner">)}>
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
          <Button onClick={handleShare} disabled={!selected}>Invite</Button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" onClick={handleLink}>
            Generate/copy share link
          </Button>
          {link ? <Input readOnly value={link} /> : null}
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
