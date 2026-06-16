"use client";

import * as Y from "yjs";
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate } from "y-protocols/awareness";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";

// Bridges Yjs document updates and awareness state over Supabase Realtime Broadcast.
export type YjsUser = {
  userId: string;
  name: string;
  color: string;
};

type YjsUpdatePayload = {
  update: number[];
};

type AwarenessPayload = {
  update: number[];
};

export class YjsSupabaseProvider {
  doc: Y.Doc;
  awareness: Awareness;
  private channel: RealtimeChannel | null = null;
  private destroyed = false;
  private pendingSync: number | null = null;

  constructor(documentId: string, doc: Y.Doc, user: YjsUser) {
    this.doc = doc;
    this.awareness = new Awareness(doc);
    this.awareness.setLocalState({ user });

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase.channel(`yjs:${documentId}`, {
      config: { broadcast: { ack: false, self: false } },
    });
    this.channel = channel;

    channel.on("broadcast", { event: "yjs-update" }, (payload) => {
      const data = payload.payload as YjsUpdatePayload;
      Y.applyUpdate(this.doc, Uint8Array.from(data.update), this);
    });

    channel.on("broadcast", { event: "awareness-update" }, (payload) => {
      const data = payload.payload as AwarenessPayload;
      applyAwarenessUpdate(this.awareness, Uint8Array.from(data.update), this);
    });

    this.doc.on("update", this.handleDocUpdate);
    this.awareness.on("update", this.handleAwarenessUpdate);
    channel.subscribe((status) => {
      if (status !== "SUBSCRIBED" || this.destroyed) return;
      this.broadcastDocState();
      this.broadcastAwarenessState([this.awareness.clientID]);
    });
  }

  destroy() {
    this.destroyed = true;
    if (this.pendingSync) window.clearTimeout(this.pendingSync);
    this.awareness.setLocalState(null);
    this.doc.off("update", this.handleDocUpdate);
    this.awareness.off("update", this.handleAwarenessUpdate);
    void this.channel?.unsubscribe();
    this.awareness.destroy();
    this.channel = null;
  }

  private handleDocUpdate = (_update: Uint8Array, origin: unknown) => {
    if (origin === this || this.destroyed) return;
    if (this.pendingSync) return;
    this.pendingSync = window.setTimeout(() => {
      this.pendingSync = null;
      this.broadcastDocState();
    }, 50);
  };

  private handleAwarenessUpdate = (
    changes: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown,
  ) => {
    if (origin === this || this.destroyed) return;
    this.broadcastAwarenessState([...changes.added, ...changes.updated, ...changes.removed]);
  };

  private broadcastDocState() {
    if (!this.channel || this.destroyed) return;
    const update = Y.encodeStateAsUpdate(this.doc);
    void this.channel.send({
      type: "broadcast",
      event: "yjs-update",
      payload: { update: Array.from(update) },
    });
  }

  private broadcastAwarenessState(clientIds: number[]) {
    if (!this.channel || this.destroyed || clientIds.length === 0) return;
    const update = encodeAwarenessUpdate(this.awareness, clientIds);
    void this.channel.send({
      type: "broadcast",
      event: "awareness-update",
      payload: { update: Array.from(update) },
    });
  }
}
