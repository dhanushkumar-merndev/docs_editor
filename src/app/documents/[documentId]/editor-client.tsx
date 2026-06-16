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
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  MousePointer2,
  Save,
  Share2,
  UnderlineIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function countImages(content: JSONContent | JSONContent[] | undefined): number {
  if (!content) return 0;
  if (Array.isArray(content)) return content.reduce((total, node) => total + countImages(node), 0);
  const current = content.type === "image" ? 1 : 0;
  return current + countImages(content.content);
}

async function imageFileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function EditorClient({ documentId, initialDocument }: { documentId: string; initialDocument: EditorDocument | null }) {
  const [doc, setDoc] = useState<EditorDocument | null>(initialDocument);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [titleDraft, setTitleDraft] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [remotePointers, setRemotePointers] = useState<Record<string, { name: string; x: number; y: number; color: string }>>({});
  const lastPointer = useRef(0);
  const role = doc?.role ?? null;
  const editable = can(role, "edit");

  useEffect(() => {
    const id = window.setTimeout(() => setTitleDraft(doc?.title ?? ""), 0);
    return () => window.clearTimeout(id);
  }, [doc?.title]);

  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key !== `ajaia-pointer-${documentId}` || !event.newValue) return;
      const pointer = JSON.parse(event.newValue) as { userId: string; name: string; x: number; y: number; color: string };
      setRemotePointers((current) => ({ ...current, [pointer.userId]: pointer }));
      window.setTimeout(() => {
        setRemotePointers((current) => {
          const copy = { ...current };
          delete copy[pointer.userId];
          return copy;
        });
      }, 2000);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [documentId]);

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
      onUpdate: () => setSaveState("dirty"),
    },
    [doc?.id, editable],
  );

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  const activeMembers = doc?.members.slice(0, 4) ?? [];

  if (!doc || !role) {
    return (
      <main className="grid min-h-dvh place-items-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Document not found</h1>
          <p className="mt-2 text-zinc-500">It may not exist, or your current demo user does not have access.</p>
          <Link className="mt-5 inline-flex" href="/dashboard">
            <Button>Back to dashboard</Button>
          </Link>
        </div>
      </main>
    );
  }

  function saveContent() {
    if (!editor || !doc) return;
    if (!can(role, "edit")) {
      toast.error("You only have view access");
      return;
    }
    setSaveState("saving");
    fetch(`/api/documents/${doc.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "save", content: editor.getJSON() }),
    })
      .then(async (response) => {
        const data = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(data.error ?? "Save failed");
        setDoc((current) => (current ? { ...current, content: editor.getJSON() as AjaiaDocument["content"], updatedAt: new Date().toISOString() } : current));
        setSaveState("saved");
        toast.success("Document saved");
      })
      .catch((error: Error) => {
        setSaveState("error");
        toast.error(error.message);
      });
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

  function broadcastPointer(event: React.MouseEvent<HTMLElement>) {
    const timestamp = event.timeStamp;
    if (timestamp - lastPointer.current < 100) return;
    lastPointer.current = timestamp;
    localStorage.setItem(
      `ajaia-pointer-${documentId}`,
      JSON.stringify({
        documentId,
        userId: "current",
        name: "Collaborator",
        color: "#2563eb",
        x: event.clientX,
        y: event.clientY,
      }),
    );
  }

  return (
    <main className="min-h-dvh bg-zinc-100 dark:bg-zinc-950" onMouseMove={broadcastPointer}>
      {Object.entries(remotePointers).map(([id, pointer]) => (
        <div key={id} className="pointer-events-none fixed z-50" style={{ left: pointer.x, top: pointer.y }}>
          <MousePointer2 className="size-5" style={{ color: pointer.color }} />
          <span className="ml-4 rounded bg-zinc-950 px-2 py-0.5 text-xs font-semibold text-white">{pointer.name}</span>
        </div>
      ))}
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
              <Button variant="outline" onClick={saveContent} disabled={!editable || saveState === "saving"}>
                <Save className="size-4" />
                Save
              </Button>
              <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900">
                <ImagePlus className="size-4" />
                Upload image
                <input className="sr-only" type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" onChange={(event) => uploadImage(event.target.files?.[0])} disabled={!can(role, "uploadImage")} />
              </label>
              <Button variant="outline" onClick={() => (can(role, "share") ? setShareOpen(true) : toast.error("Only owners can share this document"))}>
                <Share2 className="size-4" />
                Share
              </Button>
              <ThemeToggle />
            </div>
          </div>
          <Toolbar editor={editor} disabled={!editable} pageSize={doc.pageSize} onPageSize={updatePageSize} />
        </div>
      </header>

      <section className="px-3 py-8 lg:px-8">
        <div className={`mx-auto min-h-[900px] ${pageStyles[doc.pageSize]} bg-white p-8 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800 md:p-12`}>
          <EditorContent editor={editor} />
        </div>
      </section>

      {shareOpen ? <ShareDialog doc={doc} onClose={() => setShareOpen(false)} onDocumentChange={setDoc} /> : null}
    </main>
  );
}

function Toolbar({
  editor,
  disabled,
  pageSize,
  onPageSize,
}: {
  editor: Editor | null;
  disabled: boolean;
  pageSize: PageSize;
  onPageSize: (size: PageSize) => void;
}) {
  const buttons = [
    { icon: Bold, label: "Bold", run: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive("bold") },
    { icon: Italic, label: "Italic", run: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive("italic") },
    { icon: UnderlineIcon, label: "Underline", run: () => editor?.chain().focus().toggleUnderline().run(), active: editor?.isActive("underline") },
    { icon: Heading1, label: "H1", run: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), active: editor?.isActive("heading", { level: 1 }) },
    { icon: Heading2, label: "H2", run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active: editor?.isActive("heading", { level: 2 }) },
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
      <select
        className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
        value={pageSize}
        onChange={(event) => onPageSize(event.target.value as PageSize)}
      >
        <option value="a4">A4</option>
        <option value="letter">Letter</option>
        <option value="custom">Custom</option>
      </select>
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
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<MemberRole, "owner">>("viewer");
  const [link, setLink] = useState("");

  function handleShare() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email");
      return;
    }
    fetch(`/api/documents/${doc.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "shareEmail", email, role }),
    })
      .then(async (response) => {
        const data = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(data.error ?? "Share failed");
        toast.success("Document shared");
        setEmail("");
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

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-lg border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Share document</h2>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_130px_auto]">
          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="User email" />
          <select className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={role} onChange={(event) => setRole(event.target.value as Exclude<MemberRole, "owner">)}>
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
          <Button onClick={handleShare}>Invite</Button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" onClick={handleLink}>
            Generate/copy share link
          </Button>
          {link ? <Input readOnly value={link} /> : null}
        </div>
        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold">Current members</p>
          <div className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
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
