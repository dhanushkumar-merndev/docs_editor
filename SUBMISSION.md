# Submission

## Source Code

Included in this repository.

## Live Product URL

To be added after Vercel deployment.

## Walkthrough Video URL

To be added in `VIDEO_LINK.txt`.

## What Works

- Google sign-in through Better Auth
- Supabase Postgres persistence through Drizzle
- Dashboard with My Documents and Shared With Me
- Create document
- Tiptap rich text editor
- Manual save and reopen
- Owner-only rename
- Email sharing for registered users
- Public editor links for signed-in users
- Viewer/editor/owner permission handling
- Light/dark theme
- Search with debounce
- `document_activity` history table for operations
- Drizzle schema, env example, docs, and Vitest permission test

## What Is Partial

- Image insertion is validated but should be moved from data URLs to Supabase Storage URLs before heavy production use.
- Supabase Realtime presence/pointers are not fully wired.
- Transfer ownership is not implemented in the UI.

## Next 2-4 Hours

- Replace image data URLs with Supabase Storage uploads.
- Add Upstash rate limits to API entry points.
- Add a visible activity/history panel.
- Move pointer and presence transport to Supabase Realtime.
- Deploy to Vercel and record the walkthrough.
