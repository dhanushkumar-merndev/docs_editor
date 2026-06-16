# AI Workflow

I used AI tools to accelerate planning, boilerplate generation, schema design, and edge-case review. I did not rely on AI blindly for product decisions.

AI helped convert the assignment requirements into a focused implementation plan, scaffold the App Router routes, draft the Drizzle schema, build permission tests, and identify where demo-mode fallbacks were needed because environment variables would be added later.

I changed and constrained AI output where suggestions were too broad, especially around full realtime collaboration, print pagination, and `.docx` parsing. Those were intentionally documented as scope cuts so the product stayed shippable.

Correctness was verified with TypeScript, lint/build checks, and a Vitest permission test covering owner/editor/viewer/non-member behavior.

Manual UX checks should cover login/demo switching, dashboard owned/shared sections, create document, rename, rich text formatting, save/reopen after refresh, `.txt` or `.md` import, image insertion, share by email/link, and viewer restrictions.
