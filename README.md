# StudyMate persistent library fix

This patch is based on the earlier StudyMate Studio Fix V2 `app/page.tsx`. It makes the Library query `public.sources` (the table uploads actually write), not only `public.jobs`. It shows persisted uploaded files, status and upload dates, offers short-lived signed URLs, reloads records after uploads, and refreshes processing states every five seconds. It adds saved-note status and an explicit Library view after uploads.

**Important:** Only replace `app/page.tsx` if your current project is using the Studio Fix V2 version. If you've changed this file since then, merge the changes rather than overwrite them. Verify the actual deployed schema/RLS before deploying. This patch does not implement an AI processing worker.

1. Copy `app/page.tsx` into your project (after backing up or comparing your existing file).
2. Run `npm run typecheck && npm run build`.
3. Test one upload and one note save, refresh the browser, switch courses, and verify both remain visible.
4. If no files appear, inspect Supabase `public.sources` and RLS SELECT policies for the signed-in user. Storage and source rows are separate; a storage upload can succeed even when metadata insertion fails.

No Supabase schema changes or destructive migrations are included.
