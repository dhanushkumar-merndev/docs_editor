# Submission

## Source Code

https://github.com/dhanushkumar-merndev/assignment

## Live Product URL

https://assignment-ajaia.vercel.app

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
- Email sharing for registered users (direct add, no links)
- Viewer/editor/owner permission handling
- Light/dark theme
- Search with debounce
- Markdown export and preview
- Live pointer awareness via Supabase Realtime Broadcast
- `document_activity` history table for operations
- Drizzle schema, env example, docs, and Vitest permission test

## What Is Partial

- Transfer ownership is not implemented in the UI.
- Public share links were intentionally removed in favor of email-only direct adds.
- Rate limiting is not wired (Upstash Redis not set up).

## Next 2-4 Hours

- Add Upstash Redis rate limits to API entry points.
- Add a visible activity/history panel.
- Add transfer ownership UI.
- Further polish live pointer smoothness.
- Record the walkthrough video.
