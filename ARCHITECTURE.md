# Architecture

## Why Next.js App Router

Next.js App Router provides route-level UI (dashboard, editor, login), API routes (`/api/documents`, `/api/auth/[...all]`), server-side session checks, and one-command Vercel deployment. This keeps the full stack compact without a separate backend server.

## Auth

Better Auth handles Google OAuth and persists users, sessions, accounts, and verification state in Supabase Postgres through the Drizzle adapter. Session cookie is HttpOnly and checked server-side on every API call via `requireCurrentUser()`.

## Database

Supabase Postgres stores documents, members, assets, profiles, share links (unused), and `document_activity` audit history. Drizzle defines the schema in TypeScript and pushes it with `pnpm db:push`. The `content` column is JSONB and supports two formats: `TiptapDoc` (legacy) and `MarkdownDoc` (current).

## Storage

Supabase Storage bucket `document-assets` is configured but the image upload UI was intentionally cut from MVP scope. The bucket structure (`{documentId}/{assetId}-{fileName}`) is ready for future use.

## Editor

The editor uses a `<textarea>` for raw Markdown source input bound to a Yjs `Y.Text`. This keeps the MVP lightweight while adding CRDT conflict resolution. The header includes Markdown insertion controls, and the optional preview pane can render Markdown HTML via `marked` or plain text.

## Sync

Document sync uses Yjs CRDT updates transported over Supabase Realtime Broadcast. Yjs Awareness powers active member state and remote caret labels. Manual/autosave persists the merged Markdown snapshot back to Supabase Postgres.

## Sharing

Sharing is email-only via registered user search. Owner, Editor, and Viewer roles are enforced server-side with a `can()` permission helper. Maximum 10 users per document. No public/editor link sharing — this was removed to keep the scope focused on the core permission model.

## What Was Deprioritized

- Print-grade pagination — the editor is a single continuous canvas with page width simulation (A4/Letter/Custom).
- Image upload — Supabase Storage is configured but the upload dialog was cut.
- Rate limiting — Upstash Redis is connected but not wired into endpoints.
- Transfer ownership — documented as stretch, not implemented.
