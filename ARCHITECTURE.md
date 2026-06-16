# Architecture

Ajaia Docs uses the Next.js App Router because the assignment needs a compact full-stack product with route-level UI, server actions, API routes, and a straightforward Vercel deployment path.

Supabase Postgres is the persistence target for documents, members, assets, profiles, and share links. Drizzle defines the schema in TypeScript and the initial SQL migration is included in `drizzle/0000_initial.sql`.

Supabase Storage is the intended production image store. Uploaded editor images should be validated, capped at 2 MB, written to the `document-assets` bucket, saved in `document_assets`, and inserted into Tiptap as URLs. Each document is capped at 60 images. Demo mode uses browser data URLs so the workflow is testable before env values exist.

Tiptap powers rich text editing because it stores structured JSON, supports common formatting quickly, and keeps save/reopen behavior predictable.

Supabase Realtime is the intended production layer for presence and pointer broadcast. The demo approximates this with browser storage events; production should move the same payload shape to Realtime Presence/Broadcast without storing pointer positions in the database.

The editor uses a visual page canvas to approximate document layout. True print-grade pagination was intentionally deprioritized in favor of core editing, sharing, persistence, and upload workflows.

Full CRDT collaborative editing was also intentionally deferred. The product prioritizes the core document lifecycle: create, edit, save, reopen, upload, share, and enforce roles. CRDT would be the next major collaboration investment after the core slice is stable.

Rate limiting is planned through Upstash Redis for create, text/markdown import, share, upload-image, and search endpoints. The helper is present in `src/lib/rate-limit.ts`; production route handlers should apply the configured limits before mutations. Documents are limited to 10 users total, including the owner, so free-tier usage remains controlled.
