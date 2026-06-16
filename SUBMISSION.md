# Submission

## Source Code

Included in this repository.

## Live Product URL

To be added after Vercel deployment.

## Walkthrough Video URL

To be added in `VIDEO_LINK.txt`.

## Test Accounts

Demo mode:

- `dhanush@example.com` as owner/editor
- `reviewer@ajaia.com` as reviewer
- `alex@example.com` as editor

Google OAuth credentials should be added through `.env.local` for production auth.

## What Works

- Demo login and user switching
- Dashboard with document count, My Documents, Shared With Me, and Recent Documents
- Create document
- Rename document with owner-only guard
- Tiptap rich text editor
- Manual save and reopen after refresh
- `.txt` / `.md` import as a new document
- Image validation and insertion into the editor with 2 MB file limit and 60-image document cap
- Share dialog with viewer/editor roles
- 10-user per document sharing cap with house-full feedback
- Generated share links in demo mode
- Viewer/editor/owner permission handling
- Light/dark theme
- Search with debounce and accessible-doc filtering
- Active member badges and lightweight pointer awareness
- Drizzle schema, env example, docs, and Vitest permission test

## What Is Partial

- Better Auth and Supabase modules are scaffolded; real database-backed server actions need credentials and query implementation.
- Supabase Storage upload is represented in architecture and env setup; demo mode inserts images as data URLs.
- Supabase Realtime presence/pointers are approximated locally for demo mode.
- Transfer ownership is not implemented in the UI.

## Next 2-4 Hours

- Wire server actions to Drizzle queries against Supabase Postgres.
- Replace demo image data URLs with Supabase Storage uploads.
- Move pointer and presence transport to Supabase Realtime.
- Add Upstash rate limits to API/server action entry points.
- Deploy to Vercel and record the walkthrough.
