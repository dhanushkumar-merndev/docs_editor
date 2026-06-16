# Ajaia Docs

Ajaia Docs is a lightweight collaborative document editor inspired by Google Docs. It focuses on the assignment-critical slice: Google login, dashboard, document creation, Markdown editing with Yjs CRDT realtime sync, save/reopen, file import (.txt/.md), sharing with roles, owned/shared separation, validation, persistence, and tests.

## Tech Stack

Next.js App Router, TypeScript, Tailwind CSS v4, shadcn-style UI primitives, Better Auth (Google OAuth), Supabase Postgres, Supabase Realtime Broadcast, Drizzle ORM, Yjs, Markdown textarea editor, Zod, and Vercel.

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
- `UPSTASH_REDIS_REST_URL` (optional, rate limiting not wired)
- `UPSTASH_REDIS_REST_TOKEN` (optional)

## Supabase Setup

1. Create a Supabase project.
2. Use the session pooler Postgres URL for `DATABASE_URL`.
3. Run `pnpm db:push`.
4. Storage bucket `document-assets` is configured but image upload UI is not implemented.

## Better Auth Setup

Add `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`. The app exposes Better Auth at `/api/auth/[...all]`.

Google redirect URI:

```txt
https://assignment-ajaia.vercel.app/api/auth/callback/google
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

1. Sign in with Google in one browser.
2. Create a document.
3. Open the Share dialog and search for another registered user's email.
4. Assign Viewer or Editor role and click Invite.
5. Sign in with Google in a different browser/incognito as the other user.
6. The shared document appears under "Shared With Me" in the dashboard.
7. Owners can edit, rename, share, and delete. Editors can edit content only. Viewers can read only.

## Known Limitations

- The editor uses raw Markdown source with Yjs CRDT realtime sync — not a WYSIWYG rich text editor.
- Yjs updates are transported over Supabase Realtime Broadcast and saved back to Postgres as Markdown JSON.
- Comments, suggestion mode, version history, enterprise ACLs, and full `.docx` parsing are intentionally omitted.
- Image upload UI is not implemented (Supabase Storage bucket exists).
- Transfer ownership is documented as a stretch feature and not implemented in the UI.
- Rate limiting (Upstash Redis) is not wired.
- `.txt` file imports create legacy Tiptap JSON format — reopen in the Markdown editor may show raw JSON text.
