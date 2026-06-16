"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const POINTER_COLORS = [
  "#EF4444", "#3B82F6", "#22C55E", "#F59E0B", "#A855F7",
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16",
];

function hashUserId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getColor(userId: string): string {
  return POINTER_COLORS[hashUserId(userId) % POINTER_COLORS.length];
}

export type RemotePointer = {
  userId: string;
  name: string;
  color: string;
  x: number;
  y: number;
  editing: boolean;
  lastSeen: number;
};

const THROTTLE_MS = 100;
const STALE_MS = 5000;

export function useRealtimePointer(documentId: string, userId: string, userName: string) {
  const [remotePointers, setRemotePointers] = useState<Map<string, RemotePointer>>(new Map());
  const sentRef = useRef(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase.channel(`pointer:${documentId}`, {
      config: { broadcast: { ack: false, self: false } },
    });

    channel.on("broadcast", { event: "pointer" }, (payload) => {
      const data = payload.payload as { userId: string; name: string; color: string; x: number; y: number; editing: boolean };
      if (data.userId === userId) return;
      setRemotePointers((prev) => {
        const next = new Map(prev);
        next.set(data.userId, { ...data, lastSeen: Date.now() });
        return next;
      });
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [documentId, userId]);

  useEffect(() => {
    const id = setInterval(() => {
      setRemotePointers((prev) => {
        const now = Date.now();
        let changed = false;
        for (const [uid, ptr] of prev) {
          if (now - ptr.lastSeen > STALE_MS) {
            prev.delete(uid);
            changed = true;
          }
        }
        return changed ? new Map(prev) : prev;
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const trackPointer = useCallback(
    (x: number, y: number, editing?: boolean) => {
      const now = Date.now();
      if (now - sentRef.current < THROTTLE_MS) return;
      sentRef.current = now;

      const channel = channelRef.current;
      if (!channel) return;

      channel.send({
        type: "broadcast",
        event: "pointer",
        payload: { userId, name: userName, color: getColor(userId), x, y, editing: editing ?? false },
      });
    },
    [userId, userName],
  );

  const trackEditing = useCallback(
    (editing: boolean) => {
      if (!channelRef.current) return;
      setRemotePointers((prev) => {
        const next = new Map(prev);
        const existing = next.get(userId);
        if (existing) {
          next.set(userId, { ...existing, editing });
        }
        return next;
      });
      channelRef.current.send({
        type: "broadcast",
        event: "pointer",
        payload: { userId, name: userName, color: getColor(userId), x: 0, y: 0, editing },
      });
    },
    [userId, userName],
  );

  return { remotePointers, trackPointer, trackEditing };
}
