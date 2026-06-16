"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, FilePlus2, FileText, Loader2, LogOut, MoreVertical, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { authClient } from "@/lib/auth-client";
import { ConfirmDialog } from "./components/confirm-dialog";
import { DocumentTable } from "./components/document-table";
import { ProfileDialog } from "./components/profile-dialog";
import { SidebarGroup } from "./components/sidebar-group";
import { StatCard } from "./components/stat-card";
import { timeZones, type DashboardView, type PendingAction, type ProfileState } from "./dashboard-types";
import type { DocumentSummary } from "@/lib/document-service";
import type { CurrentUser } from "@/lib/session";

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

// Coordinates dashboard data, route-local chunks, document creation/import, and profile actions.
export function DashboardClient({ user }: { user: CurrentUser }) {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedView, setSelectedView] = useState<DashboardView>("my");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileState>({
    displayName: user.name || user.email,
    timeFormat: "12h",
    timeZone: "Asia/Kolkata",
  });
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  async function loadDocuments() {
    setLoading(true);
    const response = await fetch("/api/documents");
    if (response.status === 401) {
      window.location.href = "/login";
      return;
    }
    const data = await readJson<{ documents?: DocumentSummary[]; error?: string }>(response);
    if (!response.ok) toast.error(data.error ?? "Failed to load documents");
    setDocuments(data.documents ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const id = window.setTimeout(() => void loadDocuments(), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      fetch("/api/profile")
        .then(async (response) => {
          const data = await readJson<{ profile?: ProfileState }>(response);
          if (response.ok && data.profile) setProfile(data.profile);
        })
        .catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return documents.filter((doc) => doc.title.toLowerCase().includes(q)).slice(0, 10);
  }, [query, documents]);

  const myDocs = useMemo(() => documents.filter((doc) => doc.role === "owner"), [documents]);
  const sharedDocs = useMemo(() => documents.filter((doc) => doc.role !== "owner"), [documents]);
  const sidebarMyDocs = useMemo(() => [...myDocs].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 5), [myDocs]);
  const sidebarSharedDocs = useMemo(() => [...sharedDocs].sort((a, b) => Date.parse(b.sharedAt) - Date.parse(a.sharedAt)).slice(0, 5), [sharedDocs]);
  const recentDocs = useMemo(() => [...documents].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 5), [documents]);
  const activeTable = selectedView === "my" ? myDocs : selectedView === "shared" ? sharedDocs : recentDocs;
  const visibleTable = activeTable.slice(0, visibleCount);
  const activeTitle = selectedView === "my" ? "My Documents" : selectedView === "shared" ? "Shared With Me" : "Recent Documents";
  const activeEmptyText = selectedView === "my" ? "Create a document to start." : selectedView === "shared" ? "Shared documents will appear here." : "Recent documents will appear here.";

  async function createDocument() {
    setCreating(true);
    const response = await fetch("/api/documents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Untitled Document" }),
    });
    const data = await readJson<{ documentId?: string; error?: string }>(response);
    if (!response.ok || !data.documentId) {
      toast.error(data.error ?? "Failed to create document");
      setCreating(false);
      return;
    }
    window.location.href = `/documents/${data.documentId}`;
  }

  useEffect(() => {
    const id = window.setTimeout(() => setVisibleCount(20), 0);
    return () => window.clearTimeout(id);
  }, [selectedView, query]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setVisibleCount((current) => Math.min(current + 20, activeTable.length));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeTable.length]);

  async function importTextFile(file: File | undefined) {
    if (!file) return;
    if (!/\.(txt|md)$/i.test(file.name)) {
      toast.error("Supported file types: .txt and .md");
      return;
    }
    setImporting(true);
    const text = await file.text();
    const title = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim() || "Imported document";
    const content = /\.md$/i.test(file.name)
      ? { format: "markdown", text }
      : {
          type: "doc",
          content: text.split(/\n{2,}/).map((paragraph) => ({
            type: "paragraph",
            content: paragraph.trim() ? [{ type: "text", text: paragraph.trim() }] : undefined,
          })),
        };
    const response = await fetch("/api/documents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, content, imported: true }),
    });
    const data = await readJson<{ documentId?: string; error?: string }>(response);
    if (!response.ok || !data.documentId) {
      toast.error(data.error ?? "Failed to import file");
      setImporting(false);
      return;
    }
    window.location.href = `/documents/${data.documentId}`;
  }

  async function confirmAction() {
    if (!pendingAction) return;
    const { doc, type } = pendingAction;
    setActionLoading(true);
    const response =
      type === "delete"
        ? await fetch(`/api/documents/${doc.id}`, { method: "DELETE" })
        : await fetch(`/api/documents/${doc.id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "leave" }),
          });
    const data = await readJson<{ error?: string }>(response);
    if (!response.ok) {
      toast.error(data.error ?? (type === "delete" ? "Failed to delete document" : "Failed to leave document"));
      setActionLoading(false);
      return;
    }
    toast.success(type === "delete" ? "Document deleted" : "Access revoked");
    setActionLoading(false);
    setPendingAction(null);
    setDocuments((current) => current.filter((item) => item.id !== doc.id));
  }

  async function saveProfile(nextProfile: ProfileState) {
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(nextProfile),
    });
    const data = await readJson<{ error?: string }>(response);
    if (!response.ok) {
      toast.error(data.error ?? "Failed to save profile");
      return;
    }
    setProfile(nextProfile);
    setProfileOpen(false);
    toast.success("Profile updated");
  }

  async function signOut() {
    await authClient.signOut();
    window.location.href = "/login";
  }

  return (
    <main className="flex h-dvh overflow-hidden bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <aside className="hidden h-dvh w-72 shrink-0 border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 lg:flex lg:flex-col">
        <div className="flex items-center justify-between">
          <Logo />
        </div>

        <Button className="mt-6 w-full" onClick={createDocument} disabled={creating}>
          {creating ? <Loader2 className="size-4 animate-spin" /> : <FilePlus2 className="size-4" />}
          Create Document
        </Button>
        <label className="mt-2 inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900">
          {importing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Import Document
          <input className="sr-only" type="file" accept=".txt,.md,text/plain,text/markdown" onChange={(event) => void importTextFile(event.target.files?.[0])} />
        </label>
        <p className="mt-2 px-1 text-xs text-zinc-500 dark:text-zinc-400">Supported file types: .txt and .md</p>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documents..." />
        </div>
        <hr className="mt-4 border-t border-zinc-200 dark:border-zinc-800" />

        <nav className="mt-6 space-y-6 overflow-y-auto pr-1">
          {query.trim().length < 2 ? (
            <>
              <SidebarGroup title="Documents" view="my" activeView={selectedView} onView={setSelectedView} docs={sidebarMyDocs} loading={loading} emptyText="No owned documents" />
              <hr className="border-t border-zinc-200 dark:border-zinc-800" />
              <SidebarGroup title="Shared With Me" view="shared" activeView={selectedView} onView={setSelectedView} docs={sidebarSharedDocs} loading={loading} emptyText="No shared documents" />
              <hr className="border-t border-zinc-200 dark:border-zinc-800" />
              <SidebarGroup title="Recent Documents" view="recent" activeView={selectedView} onView={setSelectedView} docs={recentDocs} loading={loading} emptyText="No recent documents" />
            </>
          ) : (
            <div className="space-y-2">
              <p className="px-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Search Results</p>
              {loading ? (
                <div className="space-y-1 px-2 py-1">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ) : searchResults.length === 0 ? (
                <p className="px-2 py-2 text-xs text-zinc-500">No documents found</p>
              ) : (
                searchResults.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/documents/${doc.id}`}
                    className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                  >
                    <FileText className="size-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{doc.title}</span>
                    <ChevronRight className="size-3 shrink-0 text-zinc-400" />
                  </Link>
                ))
              )}
            </div>
          )}
        </nav>

        <div className="mt-auto rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <Avatar name={profile.displayName || user.email} src={user.image ?? undefined} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{profile.displayName || "Ajaia user"}</p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="User menu">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-64">
                <DropdownMenuLabel>
                  <span className="block truncate text-sm text-zinc-950 dark:text-zinc-50">{profile.displayName || "Ajaia user"}</span>
                  <span className="block truncate text-xs font-normal">{user.email}</span>
                  <span className="mt-1 block text-xs font-normal">
                    {profile.timeFormat} · {timeZones.find((zone) => zone.value === profile.timeZone)?.label ?? profile.timeZone}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setProfileOpen(true)}>Edit profile</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={signOut}>
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      <section className="relative min-w-0 flex-1 overflow-y-auto p-5 lg:p-8">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <header className="flex flex-col gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800 md:flex-row md:items-center md:justify-between">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Create, open, share, and manage your documents.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full min-w-64 lg:hidden">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documents..." />
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard label="Accessible Documents" value={documents.length} loading={loading} onClick={() => setSelectedView("recent")} />
          <StatCard label="My Documents" value={myDocs.length} loading={loading} onClick={() => setSelectedView("my")} />
          <StatCard label="Shared With Me" value={sharedDocs.length} loading={loading} onClick={() => setSelectedView("shared")} />
        </div>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{activeTitle}</h2>
            <Badge>{activeTable.length} total</Badge>
          </div>
          <DocumentTable
            docs={visibleTable}
            loading={loading}
            emptyText={activeEmptyText}
            timeFormat={profile.timeFormat}
            timeZone={profile.timeZone}
            onAction={setPendingAction}
          />
          {!loading && visibleCount < activeTable.length ? (
            <div ref={loadMoreRef} className="grid place-items-center py-6 text-sm text-zinc-500">
              <Loader2 className="mb-2 size-5 animate-spin" />
              Loading more documents
            </div>
          ) : (
            <div ref={loadMoreRef} className="h-4" />
          )}
        </section>
      </section>

      {pendingAction ? <ConfirmDialog pendingAction={pendingAction} loading={actionLoading} onCancel={() => setPendingAction(null)} onConfirm={confirmAction} /> : null}
      {profileOpen ? <ProfileDialog profile={profile} onClose={() => setProfileOpen(false)} onSave={saveProfile} /> : null}
    </main>
  );
}
