# OpenRouter integration — implementation status

Copy `.env.example` to `.env.local` and enter `OPENROUTER_API_KEY` only in `.env.local`, or configure it as a server-only Vercel environment variable. Never use `NEXT_PUBLIC_` for this secret. Run migration `0003_openrouter_ai.sql` after the previous migrations. Install dependencies with `npm install`. Run `npm run typecheck`, `npm test`, and `npm run test:openrouter` with a real key. The last command performs a real provider request and does not print the secret.

`POST /api/ai/generate` accepts a Supabase access token in `Authorization: Bearer ...` and `{courseId,feature,prompt,topicId?,sourceIds?,model?,conversationId?}`. The endpoint validates ownership and retrieves course-owned chunks. JSON-generating features are schema-validated and citations are checked against retrieved sources. `POST /api/ai/health` requires authentication and makes a real provider call.

## Known gaps (not represented as complete)

- The UI has not yet been wired to the new API.
- Server-side quota RPC reserves requests, but usage accounting and admin-controlled quotas require further hardening.
- Conversation history is read-only: messages are not persisted by the generate endpoint yet.
- pgvector similarity retrieval is not implemented; bounded owner-filtered source chunks are used instead.
- Streaming, durable AI job dispatch, retries across free models, automatic prompt truncation, transcript ingestion and audio deletion orchestration are not implemented.
- RLS policies on existing tables should undergo a comprehensive cross-course foreign-key authorization review before production use.
- Some free models may not comply with JSON output instructions; malformed outputs produce explicit errors.
- Separate speech-to-text, text-to-speech, OCR, and Remotion worker providers are still required.
- Tests in `tests/` are static checks, not live end-to-end integration tests.
