# Architecture

Ajaia Docs uses the Next.js App Router for a compact full-stack product with route-level UI, API routes, server-side session checks, and Vercel deployment.

Better Auth handles Google OAuth and persists users, sessions, accounts, and verification state in Supabase Postgres through the Drizzle adapter.

Supabase Postgres stores documents, members, assets, profiles, share links, and `document_activity` audit history. Drizzle defines the schema in TypeScript and pushes it with `pnpm db:push`.

Supabase Storage is the intended production image store. Uploaded editor images should be validated, capped at 2 MB, written to `document-assets`, saved in `document_assets`, and inserted into Tiptap as URLs. The current editor enforces validation and inserts images into the document JSON; replacing data URLs with Storage URLs is the next production-hardening step.

Tiptap powers rich text editing because it stores structured JSON and preserves formatting on save/reopen.

Public links are editor links: any signed-in user with the token can be added as an editor. Email sharing is stricter and only works for users already present in the Better Auth user table.

The editor uses a visual page canvas to approximate document layout. True print-grade pagination was intentionally deprioritized in favor of core editing, sharing, persistence, and upload workflows.

Full CRDT collaborative editing was intentionally deferred. The product prioritizes core lifecycle reliability: create, edit, save, reopen, share, and audit operations.

Rate limiting is planned through Upstash Redis for create, share, upload-image, and search endpoints.
