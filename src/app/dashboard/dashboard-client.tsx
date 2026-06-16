"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FilePlus2, Search } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DocumentSummary } from "@/lib/document-service";
import { formatDate } from "@/lib/utils";

export function DashboardClient() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadDocuments(search = "") {
    setLoading(true);
    const suffix = search.trim().length >= 2 ? `?q=${encodeURIComponent(search.trim())}` : "";
    const response = await fetch(`/api/documents${suffix}`);
    if (response.status === 401) {
      window.location.href = "/login";
      return;
    }
    const data = (await response.json()) as { documents?: DocumentSummary[]; error?: string };
    if (!response.ok) toast.error(data.error ?? "Failed to load documents");
    setDocuments(data.documents ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const id = window.setTimeout(() => void loadDocuments(), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void loadDocuments(query), 300);
    return () => window.clearTimeout(id);
  }, [query]);

  const myDocs = useMemo(() => documents.filter((doc) => doc.role === "owner"), [documents]);
  const sharedDocs = useMemo(() => documents.filter((doc) => doc.role !== "owner"), [documents]);

  async function createDocument() {
    const response = await fetch("/api/documents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Untitled Document" }),
    });
    const data = (await response.json()) as { documentId?: string; error?: string };
    if (!response.ok || !data.documentId) {
      toast.error(data.error ?? "Failed to create document");
      return;
    }
    window.location.href = `/documents/${data.documentId}`;
  }

  return (
    <main className="min-h-dvh bg-zinc-50 p-5 dark:bg-zinc-950 lg:p-8">
      <header className="flex flex-col gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800 md:flex-row md:items-center md:justify-between">
        <Logo />
        <div className="flex items-center gap-2">
          <div className="relative w-full min-w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documents..." />
          </div>
          <Button onClick={createDocument}>
            <FilePlus2 className="size-4" />
            Create Document
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Stat label="Accessible Documents" value={documents.length} />
        <Stat label="My Documents" value={myDocs.length} />
        <Stat label="Shared With Me" value={sharedDocs.length} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">My Documents</h2>
        <DocumentTable docs={myDocs} loading={loading} emptyText="Create a document to start." />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Shared With Me</h2>
        <DocumentTable docs={sharedDocs} loading={loading} emptyText="Shared documents will appear here." />
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function DocumentTable({ docs, loading, emptyText }: { docs: DocumentSummary[]; loading: boolean; emptyText: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {loading ? <p className="p-5 text-sm text-zinc-500">Loading...</p> : null}
      {!loading && docs.length === 0 ? <p className="p-5 text-sm text-zinc-500">{emptyText}</p> : null}
      {docs.map((doc) => (
        <div key={doc.id} className="grid gap-3 border-t border-zinc-200 p-4 first:border-t-0 dark:border-zinc-800 md:grid-cols-[1fr_180px_90px_auto] md:items-center">
          <div>
            <p className="font-medium">{doc.title}</p>
            <p className="text-sm text-zinc-500">{doc.ownerName} · {doc.ownerEmail}</p>
          </div>
          <p className="text-sm text-zinc-500">{formatDate(doc.updatedAt)}</p>
          <Badge>{doc.role === "owner" ? "Owner" : doc.role === "editor" ? "Editor" : "Viewer"}</Badge>
          <Link href={`/documents/${doc.id}`}>
            <Button variant="outline" size="sm">Open</Button>
          </Link>
        </div>
      ))}
    </div>
  );
}
