# Ajaia Docs

Ajaia Docs is a lightweight collaborative document editor inspired by Google Docs. It focuses on the assignment-critical slice: Google login, dashboard, document creation, rich text editing, save/reopen, image insertion, sharing with roles, public editor links, owned/shared separation, validation, persistence, and tests.

## Tech Stack

Next.js App Router, TypeScript, Tailwind CSS, shadcn-style UI primitives, Better Auth, Google OAuth, Supabase Postgres, Supabase Storage, Supabase Realtime, Drizzle ORM, Tiptap, Zod, Upstash Redis, Vitest, and Vercel.

## Local Setup

```bash
pnpm install
cp .env.example .env
pnpm db:push
pnpm dev
```

Open `http://localhost:3000` and sign in with Google.

## Environment Variables

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Supabase Setup

1. Create a Supabase project.
2. Use the session pooler Postgres URL for `DATABASE_URL`.
3. Run `pnpm db:push`.
4. Create a Storage bucket named `document-assets`.

Image validation is capped at 2 MB per image and 60 images per document.

## Better Auth Setup

Add `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`. The app exposes Better Auth at `/api/auth/[...all]`.

Google redirect URI:

```txt
https://ajaia-assessment.vercel.app/api/auth/callback/google
```

## Commands

```bash
pnpm dev
pnpm lint
pnpm test
pnpm build
pnpm db:push
```

## How To Test Sharing

1. Sign in with Google.
2. Create a document.
3. Share by entering another registered user's email as viewer/editor.
4. Or generate a public editor link; anyone signed in with the link can modify the document.

## Known Limitations

- Full CRDT realtime editing is intentionally out of scope.
- The editor uses a visual page canvas, not true print-grade pagination.
- Comments, suggestion mode, version history, enterprise ACLs, and full `.docx` parsing are intentionally omitted.
- Transfer ownership is documented as a stretch feature and not fully implemented in the UI.
