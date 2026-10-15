# StudyMate V1.0 — 24-module acceptance matrix

**Status meanings:** NOT STARTED = no implemented end-to-end feature; PROTOTYPE = local UI interaction only; INTEGRATED = real providers and persistence wired; TESTED = automated and manual release gates passed.

| # | Module | Status | Minimum acceptance scenario |
|---|---|---|---|
| 1 | Authentication and user management | NOT STARTED | auth, export and deletion |
| 2 | University-specific academic onboarding | PROTOTYPE | onboarding and manual courses |
| 3 | Intelligent student dashboard | PROTOTYPE | progress aggregation |
| 4 | Course workspaces | PROTOTYPE | cross-course isolation |
| 5 | AI lecture recording studio | PROTOTYPE | permission denial, recovery, verified deletion |
| 6 | Intelligent note generation and editing | NOT STARTED | autosave, provenance and versioning |
| 7 | AI document and textbook intelligence | NOT STARTED | corrupt scan/OCR recovery |
| 8 | Course-aware AI tutor | NOT STARTED | authorized citations and abstention |
| 9 | AI diagrams and illustrations | NOT STARTED | scientific review and accessible alt text |
| 10 | AI audio overviews | NOT STARTED | transcripts and audio quotas |
| 11 | AI video and animation studio | NOT STARTED | render retry and caption sync |
| 12 | Smart flashcards | PROTOTYPE | spaced repetition and offline decks |
| 13 | AI quizzes and CBT examination centre | PROTOTYPE | scoring and verified-paper labels |
| 14 | Adaptive learning and weak-area detection | NOT STARTED | weakness calculation and recommendations |
| 15 | Personalized study planner | PROTOTYPE | rescheduling and reminder permissions |
| 16 | Academic performance and progress analytics | NOT STARTED | accurate trends and privacy |
| 17 | Past-question and resource library | NOT STARTED | copyright verification and takedown |
| 18 | Study groups and collaboration | NOT STARTED | sharing revocation and moderation |
| 19 | Assignments and academic productivity | PROTOTYPE | deadline synchronization |
| 20 | Mobile-first PWA | NOT STARTED | offline queue and PWA install |
| 21 | Accessibility and personalization | PROTOTYPE | keyboard, screen reader, WCAG |
| 22 | Freemium subscriptions and payments | NOT STARTED | Paystack webhook replay and entitlements |
| 23 | Administration and institutional management | NOT STARTED | admin roles and audit |
| 24 | Security, privacy and AI reliability | NOT STARTED | RLS penetration and deletion retention |

**Evidence:** prototype is `prototype/index.html`; SQL is `supabase/migrations/0001_foundation.sql`. There are currently no automated test files, deployed API endpoints, real AI providers or verified Paystack transactions. A clickable demo does not satisfy production acceptance.

## Per-module delivery contract
Each module needs: schema and RLS tests; authenticated API; real UI states (empty/loading/error/offline/quota/success); recovery/idempotency where applicable; cost metering; automated unit/integration/E2E tests; accessibility and Android manual checks; documented dependencies.

## Current limitations
The prototype stores manually created courses, notes and tasks in localStorage and offers browser microphone playback in memory; it is not durable audio recovery, a secure store or a real AI pipeline. Demo flashcards and CBT are labeled examples. The migration is an initial schema only: group read grants, payment lifecycle, vector retrieval RPC, offline sync, source version history, job leasing, audit rules, storage policies, institutional roles, account deletion and many domain tables still require implementation and security tests.