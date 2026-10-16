# StudyMate mobile Studio + browser icon patch

Copy `app/layout.tsx`, `app/studio-fix.css` and everything in `public/` into the corresponding folders in your StudyMate project. Keep the existing `app/page.tsx`, `app/globals.css`, Supabase setup and course data intact. This patch adds missing `.studio-*` styles and browser/PWA icons.

The supplied icons are newly drawn **temporary StudyMate-themed book icons**, not the exact approved brand logo. Replace them with exported brand-board icons when available.

Run `npm install`, `npm run typecheck`, `npm run build`, then commit and push. Redeploy on Vercel. Hard refresh the browser; favicon and manifest icons may remain cached.

Note: a manifest and icons alone do **not** make the application fully offline-capable; service worker/offline support requires separate implementation and testing. The patch does not fix the previously reported login error.
