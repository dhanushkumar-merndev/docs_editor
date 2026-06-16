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

export type RemoteDocumentDraft = {
  userId: string;
  name: string;
  text: string;
  updatedAt: number;
};

const THROTTLE_MS = 100;
const CONTENT_THROTTLE_MS = 80;
const STALE_MS = 5000;

export function useRealtimePointer(documentId: string, userId: string, userName: string) {
  const [remotePointers, setRemotePointers] = useState<Map<string, RemotePointer>>(new Map());
  const [activeUserIds, setActiveUserIds] = useState<Set<string>>(new Set([userId]));
  const [remoteDraft, setRemoteDraft] = useState<RemoteDocumentDraft | null>(null);
  const sentRef = useRef(0);
  const contentSentRef = useRef(0);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase.channel(`pointer:${documentId}`, {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: userId },
      },
    });

    channel.on("presence", { event: "sync" }, () => {
      const presenceState = channel.presenceState<{ userId: string }>();
      setActiveUserIds(new Set(Object.keys(presenceState)));
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

    channel.on("broadcast", { event: "document-content" }, (payload) => {
      const data = payload.payload as RemoteDocumentDraft;
      if (data.userId === userId) return;
      setRemoteDraft(data);
      setActiveUserIds((prev) => new Set(prev).add(data.userId));
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        void channel.track({ userId, name: userName, color: getColor(userId), onlineAt: new Date().toISOString() });
      }
    });
    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [documentId, userId, userName]);

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
    (x: number, y: number, options?: { editing?: boolean; force?: boolean }) => {
      const now = Date.now();
      lastPointerRef.current = { x, y };
      if (!options?.force && now - sentRef.current < THROTTLE_MS) return;
      sentRef.current = now;

      const channel = channelRef.current;
      if (!channel) return;

      channel.send({
        type: "broadcast",
        event: "pointer",
        payload: { userId, name: userName, color: getColor(userId), x, y, editing: options?.editing ?? false },
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
        payload: { userId, name: userName, color: getColor(userId), ...lastPointerRef.current, editing },
      });
    },
    [userId, userName],
  );

  const broadcastDocumentDraft = useCallback(
    (text: string) => {
      const now = Date.now();
      if (now - contentSentRef.current < CONTENT_THROTTLE_MS) return;
      contentSentRef.current = now;
      channelRef.current?.send({
        type: "broadcast",
        event: "document-content",
        payload: { userId, name: userName, text, updatedAt: now },
      });
    },
    [userId, userName],
  );

  return { activeUserIds, remoteDraft, remotePointers, trackPointer, trackEditing, broadcastDocumentDraft };
}
