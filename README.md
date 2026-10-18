# StudyMate Admin v1 — installation

This is an **additive source-code patch**, not a full repository replacement. It was designed for the current Next.js 15 + Supabase StudyMate repository. It does not move `/`, `/welcome` or `/app` and does not touch the existing Studio features.

1. Extract the ZIP at your StudyMate project root, preserving folders.
2. In Supabase SQL Editor, run `supabase/migrations/0005_admin_academic.sql` once. If you already have a policy with the same name, check the existing migration before reapplying.
3. In Vercel, set `STUDYMATE_ADMIN_EMAILS` to the **verified email address(es)** of authorized admins, comma-separated. Never add `SUPABASE_SERVICE_ROLE_KEY` to client/public environment variables. The existing server-side `SUPABASE_SERVICE_ROLE_KEY` is required.
4. Redeploy. Sign into StudyMate using an allowlisted verified account, then open `/admin`.
5. `npm run build` before committing. This ZIP has not been fully integration-tested against your live deployment.

## Implemented
- Responsive `/admin` dashboard, protected admin API endpoints, allowlisted access checked server-side using Supabase auth.
- Institution, faculty, department, course and question CRUD (create/read/update through API; UI currently creates and lists).
- Private 5MB past-paper upload with hash duplicate detection, metadata and approval status; file originals in Supabase Storage.
- Basic expenses ledger and read-only payments ledger. **Payment records are not generated until you integrate a verified payment webhook.**
- Admin audit log and pagination for core data.
- Authenticated institution-specific course suggestion API: `GET /api/catalog/courses?institutionId=<uuid>&q=PHY`. Wire it into the student course selector as a separate step.

## Not yet implemented (do not present as working)
- Supabase Auth user directory and user moderation UI; secure backend integration needed.
- Actual PDF/DOCX question extraction, RAG indexing and AI generation using past questions; uploading alone does **not** train the model.
- Payment provider integration, refunds, financial reconciliation, financial exports.
- Full role-based permissions beyond the initial admin email allowlist, admin invitation and role management.
- File virus scanning and legal/copyright review; upload only materials you have permission to use.
- Existing AI 502 reliability problems are separate and are not fixed by this admin patch.

## Security
- Admin authorization occurs on **every** server API request; a hidden client route alone is not security.
- Admin tables have RLS enabled with no student read/write policies except approved institution/course catalogue.
- Admin email allowlist is suitable for a small founding team; before wider rollout, replace with database-backed RBAC and MFA.
- Finance totals are illustrative of **recorded data only**, capped at 1000 records and not suitable for accounting.
