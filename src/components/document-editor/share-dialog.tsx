"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRoleLabel } from "@/lib/permissions";
import type { MemberRole } from "@/lib/types";
import type { EditorDocument } from "./editor-types";

// Handles owner-only sharing by registered-user email and displays current document members.
export function ShareDialog({
  doc,
  onClose,
  onDocumentChange,
}: {
  doc: EditorDocument;
  onClose: () => void;
  onDocumentChange: (doc: EditorDocument) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ id: string; name: string; email: string } | null>(null);
  const [results, setResults] = useState<{ id: string; name: string; email: string; image: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Exclude<MemberRole, "owner">>("viewer");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (search.length < 2) return;
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

  const alreadyMembers = new Set(doc.members.map((member) => member.userId));

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
                            const found = results.find((item) => item.email === currentValue);
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
