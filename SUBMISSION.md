# Ajaia Docs — Full Submission

**Candidate:** Dhanush Kumar R  
**Email:** dhanushkumar.merndev@gmail.com  
**Assignment:** Ajaia LLC — Full Stack Product Engineer  
**Build window:** Focused 6-hour assignment slice  
**Final feature commit:** `897f5c0` — `Scope route components by page`

---

## Source Code

https://github.com/dhanushkumar-merndev/assignment

## Live Product URL

https://assignment-ajaia.vercel.app

## Walkthrough Video

https://drive.google.com/drive/folders/19kpItCTwPNY0vr60UuzqNUxoPDOdv93d?usp=sharing

---

## What Works

- Google sign-in through Better Auth
- Dashboard sidebar with My Documents / Shared With Me / Recent
- Document stats cards (total, owned, shared counts)
- Create document → opens Markdown editor
- Rename document (owner-only, inline input)
- Markdown textarea editor with live rendered HTML preview
- Save (manual + autosave 1.2s debounce)
- Reopen — content preserved after refresh
- File import: `.md` files (raw Markdown) and `.txt` files (paragraphs)
- Markdown export as `.md` download
- Share by registered-user email with Viewer/Editor role selection
- Permission enforcement server-side (owner/editor/viewer)
- Member limit: 10 users per document ("House full" error)
- Owned vs Shared document distinction in dashboard
- Delete document (owner) / Leave shared document
- Light/dark theme with flash prevention
- Debounced search (client-side filter)
- User profile editing (display name, time format, timezone)
- Live Markdown draft updates over Supabase Realtime Broadcast with ~80ms throttling
- Click-based blinking collaborator caret via Supabase Realtime Broadcast
- Optimistic save conflict guard prevents silent overwrites when two users edit at once
- Member avatar stack with active-user green dots
- Activity logging to `document_activity` table
- Zod validation on all inputs
- Poll-based sync (5s) as persistence fallback for shared document changes
- A4/Letter/Custom page width selector
- Route-scoped component chunks for documents, dashboard, and login
- Vitest permission test

## What Is Partial

- The editor uses raw Markdown source (textarea) with rendered preview — not a Tiptap WYSIWYG toolbar. Users type Markdown syntax directly.
- Concurrent editing is not CRDT/OT. Live drafts stream to idle viewers/editors, while local unsaved work is protected from being overwritten. The app blocks stale saves with a conflict message instead of silently merging two users' edits.
- Image upload UI is not implemented (Supabase Storage bucket exists, validation schema ready)
- Transfer ownership is not implemented in the UI
- Public share links were intentionally removed in favor of email-only direct adds
- Rate limiting is not wired (Upstash Redis not set up)
- `.txt` file imports create legacy Tiptap JSON — may show raw JSON text when reopened in Markdown editor
- Unused `@tiptap/*` dependencies and dead `.ProseMirror` CSS remain from the earlier Tiptap implementation

## What Would Be Built Next (2-4 hours)

- Image upload dialog with Supabase Storage integration
- Transfer ownership UI in share dialog
- Upstash Redis rate limiting on create/share/search endpoints
- Clean up unused Tiptap deps and dead CSS
- Fix `.txt` import to use Markdown format instead of Tiptap JSON
- Record the walkthrough video

---

## Architecture

### Why Next.js App Router
Route-level UI (dashboard, editor, login), API routes, server-side session checks, and one-command Vercel deployment — keeps the full stack compact.

### Auth
Better Auth with Google OAuth. Session cookie is HttpOnly, checked server-side on every API call.

### Database
Supabase Postgres + Drizzle ORM. JSONB `content` column supports two formats: `MarkdownDoc` (current, `{format: "markdown", text: "..."}`) and `TiptapDoc` (legacy, `{type: "doc", ...}`).

### Editor
Raw Markdown `<textarea>` + `marked` for live HTML preview. Chosen over Tiptap WYSIWYG because Markdown is simpler, export is free, and the preview pane gives instant visual feedback. Tradeoff: no toolbar formatting buttons — users type Markdown syntax.

The editor was refactored into focused route-scoped components and hooks. Document-specific UI lives beside the document route in `src/app/documents/[documentId]/components`, document behavior hooks live in `src/app/documents/[documentId]/hooks`, dashboard-only chunks live in `src/app/dashboard/components`, and the login form lives in `src/app/login/components`. Each touched file includes a short purpose comment, with deeper comments around realtime draft protection, stale-save conflict handling, and exact textarea caret measurement.

### Sync
Content sync uses lightweight Supabase Realtime Broadcast for live Markdown draft updates with ~80ms throttling and a 5-second polling fallback for persisted changes. The collaborator marker is a click-based blinking caret, not a mouse-follow pointer. Saves include the last known document timestamp; if another session saved first, the server returns a conflict instead of overwriting. This is safer than last-write-wins for the MVP, but it is not full CRDT/OT merging.

### Sharing
Email-only via registered user search. Owner/Editor/Viewer roles enforced server-side via `can()` helper. Max 10 users per document. No public/editor links.

### What Was Deprioritized
- Full CRDT realtime editing — out of scope
- Print-grade pagination — single canvas with A4/Letter/Custom width
- Image upload — Storage configured, UI cut
- Rate limiting — Upstash Redis not wired
- Transfer ownership — stretch feature, not implemented

---

## AI Workflow

**Tools used:** Codex and OpenCode Codex. Codex was used for the main feature build, architecture planning, schema/API scaffolding, and access-control review. OpenCode Codex was used later for refinement, UI tightening, bug fixing, and submission polish.

**Where AI helped:**
- Converted assignment requirements into a structured build plan
- Scaffolded App Router routes, Drizzle schema, and Zod validation
- Built the permission system and Vitest test
- Identified edge cases (member limits, rate limiting, file type validation)
- Refined the Markdown editor, preview split layout, collaborator presence/caret behavior, and submission documentation

**What was changed/rejected:**
- AI initially suggested full CRDT realtime editing — rejected as out of scope
- AI suggested pagination system — simplified to single canvas with page width selector
- AI suggested `.docx` parsing — rejected, limited to `.txt` and `.md`
- AI suggested public share links — removed in favor of email-only sharing

**How correctness was verified:**
- TypeScript strict mode (`npx tsc --noEmit` passes)
- Manual end-to-end testing of login, create, edit, save, reopen, share, import
- Vitest permission test covers owner/editor/viewer/non-member access rules
- Error states tested: rate limit (simulated), file type rejection, permission denied, member limit exceeded

---

## Local Setup

```bash
pnpm install
cp .env.example .env
pnpm db:push
pnpm dev
```

Open `http://localhost:3000` and sign in with Google.

### Required env vars
`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### Supabase
1. Create a Supabase project, use session pooler URL for `DATABASE_URL`
2. Run `pnpm db:push` to create tables
3. (Optional) Create `document-assets` storage bucket

### Better Auth
Add Google OAuth credentials to `.env`. Redirect URI:
```
https://assignment-ajaia.vercel.app/api/auth/callback/google
```

## Test Accounts

Sign in with any Google account. To test sharing, use two different Google accounts in separate browsers / incognito windows.

---

## Deliverables Checklist

- [x] Source code (GitHub)
- [x] Live deployment (Vercel)
- [x] README.md
- [x] Architecture note (in this file)
- [x] AI workflow note (in this file)
- [x] SUBMISSION.md
- [x] VIDEO_LINK.txt
- [x] Walkthrough video (Google Drive)
- [x] Vitest permission test
