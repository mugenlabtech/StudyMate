# StudyMate — Next.js implementation foundation

This is a **real Next.js application**, not the old static HTML prototype. It includes Supabase email authentication, user-owned course creation, persistent notes, study tasks, secure storage uploads, local microphone capture, job-status reads and an explicitly fail-closed Paystack webhook signature boundary. It does **not** claim completed AI processing, worker orchestration, payment reconciliation, Google OAuth configuration, or all 24 modules.

## Run

1. `npm install`
2. Copy `.env.example` to `.env.local` and set your Supabase URL and publishable/anon key.
3. Apply `supabase/migrations/0001_foundation.sql` to a new Supabase project after review.
4. Create a **private** Supabase Storage bucket named `private-sources` and apply `0002_storage.sql`.
5. `npm run typecheck` then `npm run dev`.

## Architecture and security

See `docs/ARCHITECTURE.md` and `docs/ACCEPTANCE_MATRIX.md`. Supabase RLS restricts courses, notes and tasks by authenticated user. Storage uploads are user/course scoped. A separate durable worker must process sources; no browser-side AI secrets. Do not run video/transcription on Vercel request functions. Audio must never be deleted before durable transcript and notes are verified. The Paystack webhook intentionally returns 503 after signature validation until durable idempotent payment processing is implemented.

## Branding

`public/brand-board.png` is the user's exact supplied board; `public/brand-mark-reference.png` is a crop from the board for development reference. Replace with a separately supplied transparent vector logo when available, without reconstructing or altering the mark.

## Known blockers

A deployed Supabase project, configured AI providers, durable worker hosting, validated pricing/quotas, and a verified Paystack merchant account are required. No E2E tests have been run. No production readiness claim is made.
