<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Ajaia Docs Assignment Build Plan

## Project

Build a lightweight collaborative document editor inspired by Google Docs for the Ajaia LLC Full Stack Product Engineer assignment.

Candidate: Dhanush Kumar R  
Goal: Ship a focused, working full-stack product slice within 4–6 hours.

The app should demonstrate document creation, editing, persistence, file handling, sharing, and product judgment. Do not try to rebuild all of Google Docs.

---

## Engineering Quality Rules

Act like a senior developer throughout the build. Prefer clear domain types, predictable validation, small well-tested permission helpers, and production-minded failure states.

TypeScript must be completed properly for the feature being touched. Do not silence related type errors by marking values as `any` or broad `unknown`; define real request, response, document, member, and editor-content types instead.

Because this project is built for free-tier friendly infrastructure, enforce product limits in both validation and user-facing UI:

- Maximum 10 users per document, including owner.
- If a document already has 10 users, sharing must fail with: `House full. Try again after sometime.`
- Maximum 60 uploaded images per document.
- Maximum image file size is 2 MB.
- Important creation/upload/share/search actions must be rate limited.

---

## Final Tech Stack

Use this stack only:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Better Auth
- Google OAuth
- Supabase Postgres
- Supabase Storage
- Supabase Realtime
- Drizzle ORM
- Tiptap Editor
- Zod
- Upstash Redis
- Vitest
- Vercel

---

## Product Name

Use a simple product name:

**Ajaia Docs**

---

## Main Product Scope

### Core assignment features

The app must support:

- User login
- Document dashboard
- Create document
- Rename document
- Rich text editing in browser
- Save document
- Reopen saved document after refresh
- Upload file into product workflow
- Upload image into editor
- Share document with another user
- Viewer/editor role handling
- Owned vs shared document distinction
- Persistence using Supabase
- Basic validation and error handling
- At least one automated test
- README, architecture note, AI workflow note, and submission files

### Product polish features

Add:

- shadcn UI layout
- Light/dark theme
- Sidebar navigation
- Recent documents
- Search documents with debounce
- User profile edit dialog
- Active user badges
- Lightweight live pointer awareness

### Intentional scope cuts

Do not build:

- Full Google Docs-level CRDT collaboration
- True print-grade page pagination
- Comments
- Suggestion mode
- Version history
- Full `.docx` parsing
- Enterprise access control

Mention these clearly in README and architecture note.

---

## UI Blocks to Use

Install these shadcn blocks/components:

```bash
npx shadcn@latest add login-04
npx shadcn@latest add sidebar-07
```

Also add:

```bash
npx shadcn@latest add button input dialog dropdown-menu avatar badge separator tooltip sonner skeleton
npx shadcn@latest add toggle select tabs popover card command scroll-area
```

---

## App Routes

Use these routes:

```txt
/
/login
/dashboard
/documents/[documentId]
/share/[token]
```

### `/login`

Use `login-04` shadcn block.

Login options:

- Google sign-in through Better Auth
- Optional demo user mode if needed for reviewers

After login, redirect to:

```txt
/dashboard
```

---

## Dashboard Requirements

Use `sidebar-07` as base layout.

### Sidebar

Sidebar should contain:

```txt
Ajaia Docs

+ Create Document

Documents
Shared With Me

Search documents...

Recent Documents
- Recent doc 1
- Recent doc 2
- Recent doc 3

Bottom user section:
Avatar
Display name
Email
Edit profile button
```

### Main dashboard area

Show:

```txt
Header
Document count in center/top area
Create Document button on top-right also if needed
My Documents section
Shared With Me section
Recent Documents section
```

Document cards/table should show:

- Document title
- Owner name/email
- Role: Owner / Editor / Viewer
- Updated date
- Open button

---

## User Profile Edit

Bottom sidebar user card should have edit action.

When clicked:

- Open shadcn Dialog
- Allow user to edit display name
- Save to `user_profiles`

Fields:

```txt
display_name
avatar_url optional
```

---

## Document Creation Flow

When user clicks `Create Document`:

1. Create new row in `documents`
2. Title should be `Untitled Document`
3. Owner should be current user
4. Add owner entry in `document_members`
5. Redirect to `/documents/[documentId]`

Default content should be empty Tiptap JSON:

```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph"
    }
  ]
}
```

---

## Document Rename

Support rename in editor header.

Preferred UX:

- Document title is visible at top
- Double-click title to edit OR use inline input
- Save title on blur or Enter
- Only owner can rename

Editor and viewer should not rename unless explicitly allowed.

---

## Editor Requirements

Use Tiptap.

Required formatting:

- Bold
- Italic
- Underline
- Heading 1
- Heading 2
- Bullet list
- Numbered list
- Text size or heading variation

Useful extensions:

- StarterKit
- Underline
- Image
- Link optional
- Placeholder optional

Toolbar should be in the editor header area.

Editor page layout:

```txt
Top Header:
Back button
Document title
Save status
Share button
Upload image button
Theme toggle
Active member badges

Toolbar:
Bold
Italic
Underline
H1
H2
Bullet list
Numbered list
Page size selector

Editor canvas:
White page style
A4 / Letter / Custom visual page mode
```

---

## Page Size Feature

Use a simple visual page system.

Do not build true Google Docs pagination.

Support:

```txt
A4
Letter
Custom
```

This should only affect editor canvas width/style.

Optional button:

```txt
+ Add Page
```

But internally keep one Tiptap document for MVP.

Architecture note must mention:

```txt
The editor uses a visual page canvas to approximate document layout. True print-grade pagination was intentionally deprioritized in favor of core editing, sharing, persistence, and upload workflows.
```

---

## Save and Reopen

Document content is saved as Tiptap JSON in Supabase Postgres.

Save flow:

```txt
Tiptap editor content
→ editor.getJSON()
→ validate with Zod
→ update documents.content
→ update documents.updated_at
```

Reopen flow:

```txt
Fetch documents.content
→ pass JSON into Tiptap editor
→ formatting preserved
```

Save UX:

- Show `Unsaved changes`
- Show `Saving...`
- Show `Saved`
- Show error toast if save fails

Use manual save for reliability. Autosave can be added later.

---

## File Upload Feature

Support text import:

```txt
.txt
.md
```

Flow:

```txt
User uploads .txt or .md
Read file text in browser
Create new document
Set document title from file name
Convert file content into Tiptap paragraph content
Save to Supabase Postgres
Open new document
```

State clearly in UI:

```txt
Supported file types: .txt and .md
```

Do not parse `.docx` in MVP.

---

## Image Upload Feature

Use Supabase Storage for images.

Supported image types:

```txt
.png
.jpg
.jpeg
.webp
```

Flow:

```txt
User uploads image
Validate type and size
Upload image to Supabase Storage bucket
Create row in document_assets
Get public or signed URL
Insert image URL into Tiptap editor
Save document content JSON
```

Recommended max size:

```txt
2 MB
```

Per-document image limit:

```txt
60 images
```

Storage bucket:

```txt
document-assets
```

Storage path format:

```txt
{documentId}/{assetId}-{fileName}
```

---

## Sharing Requirements

Support sharing through:

- Email/member search
- Share link
- Role selection

Roles:

```txt
owner
editor
viewer
```

### Permission rules

Owner can:

- Read
- Edit content
- Rename document
- Share document
- Transfer ownership
- Upload image
- Delete document

Editor can:

- Read
- Edit content
- Upload image

Editor cannot:

- Share
- Transfer ownership
- Delete document

Viewer can:

- Read only

Viewer cannot:

- Edit content
- Upload image
- Share
- Transfer ownership
- Delete document

### Share dialog

Use shadcn Dialog.

Fields:

```txt
User email
Role: viewer/editor
Generate/copy share link
Current members list
```

Only owner can open share management.

### Member limit

For free-tier friendliness, each document may have at most:

```txt
10 users total, including owner
```

If a document already has 10 users, sharing must fail with:

```txt
House full. Try again after sometime.
```

---

## Transfer Ownership

Add only after core sharing works.

Flow:

```txt
Owner opens share dialog
Select existing member
Click Transfer ownership
Confirm dialog
Update documents.owner_id
Set new user role to owner
Set old owner role to editor
```

This is a stretch feature. If incomplete, document it honestly.

---

## Owned and Shared Distinction

Dashboard must clearly separate:

```txt
My Documents
Shared With Me
```

Logic:

- My Documents: `documents.owner_id = currentUser.id`
- Shared With Me: current user exists in `document_members` but is not owner

---

## Search Requirements

Sidebar should include search.

Frontend:

- Debounce input by 300 ms
- Minimum query length: 2 characters
- Show max 10 results
- Show loading state
- Show empty state

Backend:

- Check auth session
- Rate limit using Upstash Redis
- Search only documents accessible to current user
- Never expose other users' private documents

Search fields:

- Document title only for MVP

---

## Rate Limiting

Use Upstash Redis for important mutation/search endpoints.

Apply rate limit to:

```txt
POST /api/documents
POST /api/documents/[id]/share
POST /api/documents/[id]/upload-image
GET /api/search
```

Avoid aggressive rate limit for save if manual save is used.

Example limits:

```txt
Create document: 10/minute
Share document: 20/minute
Image upload: 20/hour
Search: 60/minute
```

Also apply create-document rate limiting to text/markdown file import, since file import creates documents.

---

## Realtime Presence and Live Pointer

Use Supabase Realtime.

### Presence

Show active members in top-right editor header as badges/avatars.

Example:

```txt
Dhanush
Reviewer
Alex
```

### Live pointer

Use Supabase Realtime Broadcast.

Send mouse position:

```ts
{
  documentId: string,
  userId: string,
  name: string,
  color: string,
  x: number,
  y: number
}
```

Throttle pointer events:

```txt
80–120 ms
```

Display remote pointer:

- Colored cursor/pointer
- User name label
- Slight bold/color highlight on hover/active movement

Do not store pointer positions in DB.

This is a collaboration polish feature, not core editing sync.

---

## Database Schema

### documents

```sql
create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled Document',
  content jsonb not null,
  owner_id text not null,
  page_size text not null default 'a4',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### document_members

```sql
create table document_members (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  user_id text not null,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz default now(),
  unique(document_id, user_id)
);
```

### document_assets

```sql
create table document_assets (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  uploaded_by text not null,
  storage_path text not null,
  file_name text not null,
  file_type text not null,
  file_size int,
  created_at timestamptz default now()
);
```

### user_profiles

```sql
create table user_profiles (
  user_id text primary key,
  display_name text,
  avatar_url text,
  updated_at timestamptz default now()
);
```

### share_links

Optional but useful:

```sql
create table share_links (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  token text unique not null,
  role text not null check (role in ('editor', 'viewer')),
  created_by text not null,
  expires_at timestamptz,
  created_at timestamptz default now()
);
```

---

## Validation

Use Zod for:

- Document title
- Share role
- User email
- Uploaded file type
- Uploaded file size
- Page size
- Tiptap JSON shape where practical

Examples:

```txt
Title: 1–120 characters
Role: viewer/editor
Image size: max 2 MB
Images per document: max 60
Document members: max 10 users including owner
Text upload: .txt or .md only
Search query: max 80 characters
```

---

## Error Handling

Handle:

- Not logged in
- Document not found
- No access
- Viewer trying to edit
- Invalid file type
- File too large
- Save failed
- Share failed
- Rate limit exceeded

Use shadcn/sonner toast messages.

Example messages:

```txt
Document saved
You only have view access
Only owners can share this document
Unsupported file type
Image must be under 2 MB
This document already has 60 images
House full. Try again after sometime.
Too many requests. Try again shortly.
```

---

## API / Server Actions

Prefer server actions for simple mutations.

Required functions:

```txt
createDocument()
getAccessibleDocuments()
getDocumentById()
updateDocumentContent()
renameDocument()
shareDocument()
updateMemberRole()
transferOwnership()
uploadImageAsset()
updateUserProfile()
searchDocuments()
```

Each function must:

1. Check session
2. Validate input
3. Check permission
4. Execute DB query
5. Return typed response

---

## Testing

Add at least one meaningful automated test.

Recommended test:

```txt
Permission logic: owner/editor/viewer access rules
```

Test cases:

```txt
Owner can edit and share
Editor can edit but cannot share
Viewer can read but cannot edit
Non-member cannot access
```

Use Vitest.

Optional second test:

```txt
Search returns only accessible documents
```

---

## Execution Order

Build in this exact order.

### Phase 1 — Project setup

1. Create Next.js app with TypeScript
2. Setup Tailwind
3. Setup shadcn/ui
4. Add `login-04`
5. Add `sidebar-07`
6. Setup dark/light theme with `next-themes`

### Phase 2 — Auth

1. Setup Better Auth
2. Configure Google OAuth
3. Generate Better Auth schema
4. Connect Better Auth with Supabase Postgres
5. Create login route
6. Redirect authenticated users to dashboard

### Phase 3 — Database

1. Setup Drizzle
2. Add documents table
3. Add document_members table
4. Add document_assets table
5. Add user_profiles table
6. Run migrations
7. Seed/test users if needed

### Phase 4 — Dashboard

1. Build sidebar layout
2. Add Documents nav
3. Add Shared With Me nav
4. Add Create Document button
5. Add document count
6. Add recent documents
7. Add user bottom card
8. Add edit profile dialog

### Phase 5 — Document create/open

1. Create document server action
2. Add owner member row
3. Redirect to editor
4. Fetch document by id
5. Enforce access check

### Phase 6 — Tiptap editor

1. Install Tiptap
2. Add StarterKit
3. Add Underline
4. Add Image extension
5. Build toolbar
6. Render editor canvas
7. Save JSON content
8. Reopen saved JSON content
9. Add save status

### Phase 7 — Rename and page size

1. Inline title edit
2. Owner-only rename
3. Page size selector
4. Visual A4/Letter/Custom canvas

### Phase 8 — Uploads

1. Add `.txt` / `.md` import
2. Create document from uploaded text
3. Setup Supabase Storage bucket
4. Add image upload validation
5. Upload image to Supabase Storage
6. Insert image into Tiptap editor
7. Save image metadata in document_assets

### Phase 9 — Sharing

1. Share dialog
2. Share by email
3. Assign viewer/editor role
4. Show current members
5. Enforce role permissions
6. Add share link if time permits
7. Add transfer ownership if time permits

### Phase 10 — Search and rate limit

1. Add debounced search input
2. Search accessible docs only
3. Limit results to 10
4. Add Upstash Redis rate limit
5. Add loading and empty states

### Phase 11 — Realtime polish

1. Add Supabase Realtime presence
2. Show active member badges
3. Add live pointer broadcast
4. Throttle pointer events
5. Show colored pointer with name

### Phase 12 — Quality and submission

1. Add Vitest test
2. Add README.md
3. Add ARCHITECTURE.md
4. Add AI_WORKFLOW.md
5. Add SUBMISSION.md
6. Deploy to Vercel
7. Record 3–5 minute walkthrough video
8. Put all deliverables in Google Drive

---

## README Must Mention

Include:

- Project overview
- Tech stack
- Local setup
- Environment variables
- Supabase setup
- Better Auth setup
- Storage bucket setup
- How to run migrations
- How to run tests
- How to test sharing
- Live URL
- Demo credentials if applicable
- Known limitations

---

## Architecture Note Must Mention

Include:

- Why Next.js
- Why Supabase Postgres
- Why Supabase Storage for images
- Why Tiptap for rich text
- Why Supabase Realtime for presence/pointer
- Why not full CRDT realtime editing
- Why not full Google Docs pagination
- Prioritized core document lifecycle over stretch features

---

## AI Workflow Note Must Mention

Include:

- AI tools used
- Where AI helped
- What AI output was changed/rejected
- How correctness was verified
- How UX was manually tested
- How edge cases were checked

Suggested wording:

```txt
I used AI tools to accelerate planning, boilerplate generation, schema design, and edge-case review. I did not rely on AI blindly for product decisions. I manually reviewed generated code, simplified over-scoped suggestions, verified access-control behavior with tests, and tested the main user flow end-to-end before submission.
```

---

## Walkthrough Video Flow

The 3–5 minute video should show:

1. Login with Google or demo user
2. Dashboard with document count
3. Create new document
4. Rename document
5. Use rich text formatting
6. Save document
7. Refresh and reopen document
8. Upload `.txt` / `.md` as document
9. Upload image into editor
10. Share with another user as viewer/editor
11. Switch user or open shared account
12. Show owned vs shared document distinction
13. Show active member badge / pointer if completed
14. Explain what was intentionally deprioritized
15. Explain AI usage briefly

---

## Submission Files

Create these files:

```txt
README.md
ARCHITECTURE.md
AI_WORKFLOW.md
SUBMISSION.md
VIDEO_LINK.txt
```

`SUBMISSION.md` should list:

- Source code included
- Live product URL
- Walkthrough video URL
- Test accounts / credentials
- What works
- What is partial
- What would be built next in 2–4 hours

---

## Final Priority Reminder

Do not overbuild.

The strongest submission is a working end-to-end product with clear tradeoffs.

Highest priority:

```txt
Auth
Dashboard
Create document
Tiptap editor
Save/reopen
Upload text/image
Share with roles
Owned/shared distinction
Persistence
Test
README/deployment/video
```

Only after that, add:

```txt
Transfer ownership
Active badges
Live pointer
Custom page size polish
```

If time runs out, stop and document what is working, what is incomplete, and what you would build next.
