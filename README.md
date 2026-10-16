# StudyMate — AI integration patch (October 2026)

This patch adds real server-side OpenRouter calls, authenticated AI buttons in Course Notes and Visual Learning, and an end-to-end document analysis route. It is based on the current Studio page structure and preserves its five tools, saved notes, and Library actions.

## Install

1. **Back up your project or commit it first.** Copy the contents of this package into the StudyMate project root, merging directories. It includes a full `app/page.tsx` based on the latest functional Studio patch; if you have newer edits, compare before overwriting.
2. `npm install` to install `mammoth` and `pdf-parse` and their typings. Keep your existing lockfile and commit the updated lockfile.
3. Import `./ai-additions.css` in `app/layout.tsx` (after existing CSS imports), or append its styles to your current global CSS.
4. In Vercel Production environment variables set `OPENROUTER_API_KEY`, `OPENROUTER_MODEL=openrouter/free`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and **server-only** `SUPABASE_SERVICE_ROLE_KEY` (from Supabase API settings). **Never prefix the service role key with NEXT_PUBLIC_ or expose it to the browser.** The service role key is required to store document extraction chunks and generated notes securely after verifying the signed-in owner.
5. Apply your existing `0003_openrouter_ai.sql` migration if not yet applied; the `/api/ai/generate` route requires its `reserve_ai_request` and `log_ai_request` RPC functions. Do not re-run unrelated migrations blindly. Existing `sources`, `notes`, and `source_chunks` tables are also required.
6. `npm run typecheck && npm run build`. Commit, push, and deploy on Vercel.
7. Test an authenticated TXT, PDF (text-based), and DOCX upload; watch the source status change and verify the generated note in Library. Test Generate Notes and Generate AI Concept Map on a course. Check Vercel Function logs for failures.

## What is real vs still pending

- **Real:** OpenRouter requests on the server; authenticated user checks; course authorization; PDF/DOCX/TXT extraction; model-generated study notes; source chunks saved for subsequent course-aware AI; status changes; manual retries; AI-generated note/summary/diagram/storyboard/audio-script JSON outputs; saving AI notes to Library.
- **Not implemented:** durable queued background workers, speech-to-text for audio, OCR for scanned PDFs/images, audio file synthesis, diagram rendering as graphics, Remotion video rendering, AI title persistence in a dedicated `title` column, full app-wide AI coverage. Diagram/audio/video generation produces structured scripts/data, not finished media.
- Document processing runs in a **single Vercel request**, with `maxDuration=60`. Longer files or slow models can time out. This is not a durable queue. Free OpenRouter models can be unavailable or rate-limited.
- Processing a PDF, DOCX, or TXT automatically begins after upload while the page remains open. Older pending files can be started with **Analyse with AI** in Studio Library.
- `pdf-parse` handles text PDFs, not image-only scanned PDFs. For audio recordings, files remain saved but are not transcribed.
- If `source_chunks` or `notes` insertion fails, processing shows a failure instead of a false success. The user can retry.

## GitHub deployment limitation

The connected GitHub integration returned HTTP 403 when creating a branch for `mugenlabtech/StudyMate`. This package is **not deployed**, and the build could not be verified here because dependency installation timed out. Do not represent this patch as production-tested.
