# Ajaia Docs

Ajaia Docs is a lightweight collaborative document editor inspired by Google Docs. It focuses on the assignment-critical slice: login/demo access, dashboard, document creation, rich text editing, save/reopen, text import, image insertion, sharing with roles, owned/shared separation, validation, and tests.

## Tech Stack

Next.js App Router, TypeScript, Tailwind CSS, shadcn-style UI primitives, Better Auth, Google OAuth, Supabase Postgres, Supabase Storage, Supabase Realtime, Drizzle ORM, Tiptap, Zod, Upstash Redis, Vitest, and Vercel.

## Local Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`. Demo mode works without secrets using browser localStorage. Add real env values when connecting Better Auth, Supabase, and Upstash.

## Environment Variables

See `.env.example` for the full list:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Supabase Setup

1. Create a Supabase project.
2. Add `DATABASE_URL` to `.env.local`.
3. Run the SQL in `drizzle/0000_initial.sql` or run Drizzle migrations after configuring credentials.
4. Create a public or signed Storage bucket named `document-assets`.

Image uploads in demo mode use local data URLs. In production, route uploads through Supabase Storage with paths like `{documentId}/{assetId}-{fileName}` and persist metadata in `document_assets`. Images are limited to 2 MB each, with a maximum of 60 images per document.

## Better Auth Setup

Add `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`. The app exposes Better Auth at `/api/auth/[...all]`. Demo login remains available for reviewers until Google OAuth is configured.

## Commands

```bash
pnpm dev
pnpm lint
pnpm test
pnpm build
pnpm db:generate
pnpm db:migrate
```

## How To Test Sharing

1. Log in as Dhanush from `/login`.
2. Create or open a document.
3. Click Share, invite `reviewer@ajaia.com` as viewer or editor, or generate a share link.
4. Switch demo user in the sidebar to Reviewer.
5. Confirm the document appears under Shared With Me and role restrictions apply.

## Known Limitations

- Full CRDT realtime editing is intentionally out of scope.
- The editor uses a visual page canvas, not true print-grade pagination.
- Comments, suggestion mode, version history, enterprise ACLs, and full `.docx` parsing are intentionally omitted.
- Transfer ownership is documented as a stretch feature and not fully implemented in the demo UI.
- Demo mode uses localStorage; real deployment should wire the server actions to Drizzle/Supabase queries.
- Documents are capped at 10 users total for free-tier friendliness. When full, sharing returns: `House full. Try again after sometime.`
- Important create/import/share/upload/search actions should be rate limited in production with Upstash Redis; demo mode enforces local equivalents.

## Live URL

To be added after Vercel deployment.
