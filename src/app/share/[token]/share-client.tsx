"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ShareClient({ token }: { token: string }) {
  const [documentId, setDocumentId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/share/${token}`, { method: "POST", signal: controller.signal })
      .then(async (response) => {
        const data = (await response.json()) as { documentId?: string };
        setDocumentId(response.ok && data.documentId ? data.documentId : null);
      })
      .catch(() => setDocumentId(null));
    return () => controller.abort();
  }, [token]);

  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        {documentId ? (
          <>
            <Badge>Public link</Badge>
            <h1 className="text-2xl font-semibold">Document added</h1>
            <p className="mt-2 text-zinc-500">This public share link added the document to your shared list.</p>
            <Link className="mt-5 inline-flex" href={`/documents/${documentId}`}>
              <Button>Open document</Button>
            </Link>
          </>
        ) : documentId === undefined ? (
          <>
            <h1 className="text-2xl font-semibold">Opening share link...</h1>
            <p className="mt-2 text-zinc-500">Public links do not need a separate approval step.</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Invalid share link</h1>
            <p className="mt-2 text-zinc-500">Ask the owner to generate a new link, or the document may be full.</p>
            <Link className="mt-5 inline-flex" href="/dashboard">
              <Button>Back to dashboard</Button>
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
