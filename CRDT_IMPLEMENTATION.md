# CRDT Realtime Editing — Implementation Plan

Add collaborative real-time editing to the existing Markdown editor using **Yjs** over **Supabase Realtime Broadcast**.

No Tiptap/WYSIWYG. The `<textarea>` + Markdown stays.

---

## Overview

```
textarea  ←→  Y.Text (Yjs doc)  ←→  y-supabase-provider  ←→  Supabase Realtime Broadcast
                      ↕
            Supabase Postgres (manual save)
```

- **Yjs** handles CRDT conflict resolution (no 409 save conflicts)
- **Supabase Realtime Broadcast** is the transport for syncing Yjs updates between clients
- **Yjs Awareness** replaces the current custom pointer/presence system
- **Manual save** still persists to Supabase Postgres

---

## Step 1 — Install

```
npm install yjs
```

No other packages needed.

---

## Step 2 — `src/lib/y-supabase-provider.ts` (CREATE)

Custom Yjs provider over Supabase Realtime Broadcast.

**Responsibilities:**
- Subscribe to Supabase Realtime channel `yjs:${documentId}`
- On Yjs doc update → serialize as `Uint8Array` → broadcast `"yjs-update"` event
- On receive `"yjs-update"` → apply `Y.applyUpdate(doc, data)`
- Yjs Awareness: track online users, send/receive awareness state via broadcast
- Set local awareness state: `{ userId, name, color }`
- Throttle outgoing updates (50ms coalescing via `Y.encodeStateAsUpdate` debounce)
- Clean up channel + awareness on unmount

**Interface:**

```ts
class YjsSupabaseProvider {
  doc: Y.Doc
  awareness: awarenessProtocol.Awareness
  destroy(): void
}
```

---

## Step 3 — `src/lib/y-textarea.ts` (CREATE)

Tiny utility that binds a `Y.Text` type to an HTML `<textarea>`.

**Logic:**
- On init: `ytext = doc.getText("content")`
- Yjs → DOM: `ytext.observe(() => { textarea.value = ytext.toString() })`
- DOM → Yjs: `textarea.addEventListener("input", () => { ... })`
- Uses a `_updating` flag to prevent re-entrant loops
- Provides `destroy()` to unbind

**Interface:**

```ts
function bindYTextToTextarea(ytext: Y.Text, textarea: HTMLTextAreaElement): () => void
// Returns unbind function
```

---

## Step 4 — Rewrite `use-markdown-document.ts`

### What changes:

| Current | New |
|---------|-----|
| Yjs not used | Creates `Y.Doc` + `Y.Text("content")` on mount |
| `remoteDraft` broadcast via Supabase | Replaced by Yjs provider |
| 5s polling for remote changes | **Removed** — Yjs handles real-time sync |
| `saveContent` with `expectedUpdatedAt` guard | Manual save, no conflict guard (CRDT merges) |
| `markdownText` state driven by user input | Textarea bound to `Y.Text` — state driven by Yjs |
| Autosave with 1.2s debounce | Keep autosave but simplified |
| No cleanup | Destroy Y.Doc + provider on unmount |

### New flow:

```
Mount:
  fetch doc → create Y.Doc → Y.Text("content") ← Y.applyUpdate or set text
  → create YjsSupabaseProvider
  → bindYTextToTextarea(ytext, textareaRef.current)

Edit:
  user types in textarea → y-text updates Y.Text → Yjs syncs via provider → all clients update

Save:
  manual (or autosave) → serialize ytext.toString() → PATCH /api/documents/[id]

Unmount:
  provider.destroy() → doc.destroy()
```

### Return values:

Keep same interface: `doc`, `editable`, `markdownText`, `saveState`, `renameDocument`, `role`, `setDoc`, `setTitleDraft`, `titleDraft`

But `markdownText` now comes from Y.Text observe callback instead of `useState`.

---

## Step 5 — Rewrite `editor-client.tsx`

### Remove:

| Import | Reason |
|--------|--------|
| `useRealtimePointer` | Replaced by Yjs provider |
| `useCaretBroadcast` | Replaced by Yjs Awareness |
| `useAutoResizeTextarea` | No longer needed |
| `MarkdownPreview` | Remove preview pane |
| `broadcastDocumentDraft` | Yjs syncs content |
| `remoteDraft` | Yjs syncs content |
| `remotePointers` | Yjs awareness provides pointers |
| `trackPointer`, `trackEditing` | Yjs awareness |

### Add:

| Import | Reason |
|--------|--------|
| Yjs awareness state | Provides `activeUserIds`, `remotePointers` from Yjs provider |
| Awareness-based pointer overlay | Render remote cursors from Yjs awareness data |

### Wire active members:

Yjs awareness → `awareness.getStates()` → `activeUserIds` set → `MembersStack`

---

## Step 6 — Modify `editor-canvas.tsx`

### Remove props:

- `onBroadcastDraft`
- `onCaretMove`
- `onEditStateChange`
- `remotePointers` (old type)

### Add:

- Awareness-based pointer overlay (reads from Yjs provider awareness)
- Keep textarea with `onChange` → updates `Y.Text` directly
- Keep `readOnly` for viewers

---

## Step 7 — Modify `document-service.ts`

In `saveDocumentContent()`:

- **Remove** the `expectedUpdatedAt` parameter and conflict check
- Save always succeeds (CRDT has already merged)
- Keep everything else

---

## Step 8 — Delete deprecated files

| File | Reason |
|------|--------|
| `src/hooks/use-realtime-pointer.ts` | Replaced by `y-supabase-provider.ts` |
| `src/app/documents/[documentId]/hooks/use-caret-broadcast.ts` | Replaced by Yjs Awareness |
| `src/app/documents/[documentId]/hooks/use-auto-resize-textarea.ts` | No longer needed |
| `src/components/pointer-overlay.tsx` | Replaced by awareness-based overlay |

---

## Step 9 — Create awareness-based pointer overlay

**`src/components/yjs-pointer-overlay.tsx`** (NEW)

Reads Yjs Awareness states and renders colored carets + name labels.

Similar visual to current `PointerOverlay`, but data source is `awareness.getStates()` instead of the old Realtime broadcast.

---

## Step 10 — Build & verify

```
npm run build
npm run test
```

Verify:
1. Two browser tabs editing the same document sync in real-time
2. No save conflicts (edit simultaneously, both save)
3. Cursor positions shown for all active users
4. Viewer cannot edit
5. Members stack shows online users

---

## Files changed

| Action | File |
|--------|------|
| CREATE | `src/lib/y-supabase-provider.ts` |
| CREATE | `src/lib/y-textarea.ts` |
| CREATE | `src/components/yjs-pointer-overlay.tsx` |
| REWRITE | `src/app/documents/[documentId]/hooks/use-markdown-document.ts` |
| REWRITE | `src/app/documents/[documentId]/editor-client.tsx` |
| MODIFY | `src/app/documents/[documentId]/components/editor-canvas.tsx` |
| MODIFY | `src/lib/document-service.ts` |
| DELETE | `src/hooks/use-realtime-pointer.ts` |
| DELETE | `src/app/documents/[documentId]/hooks/use-caret-broadcast.ts` |
| DELETE | `src/app/documents/[documentId]/hooks/use-auto-resize-textarea.ts` |
| DELETE | `src/components/pointer-overlay.tsx` |
