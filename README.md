# StudyMate targeted update (not a complete overhaul)

GitHub integration denied branch creation (HTTP 403). These files are prepared locally and are NOT pushed.

1. Copy `lib/supabase.ts` into your project's `lib/supabase.ts`.
2. Copy `app/studio-overhaul.css` and `app/loading.tsx` into your project's `app/` folder.
3. In `app/layout.tsx`, add `import './studio-overhaul.css';` after the existing globals.css import.
4. In `app/page.tsx`, change the existing `<main className="main">` within the authenticated shell to `<main id="main" className="main">` to fix the skip link. Add `id="main"` to other top-level main elements too.
5. Run `npm run typecheck`, `npm run build`, and test actual signup/login, courses, note saving and file uploads.

The existing manifest has no icons and the current root page is auth-gated. Full PWA enablement, a public landing page, and verified login error repair require additional changes and testing. This package does not claim to complete those tasks.
