# 9labs — Architecture

One repo, one Next.js 16 app, deployed as one Cloudflare Worker (OpenNext). Three layers:

```
┌──────────────────────── FRONTEND ────────────────────────┐
│  Web (public site)               Admin (studio)          │
│  src/app/(site)                  src/app/(studio)/admin  │
│  src/components/*                src/studio/*            │
│  src/site/backend.ts             src/studio/api.ts       │
└───────────────┬──────────────────────────┬───────────────┘
                │ /api/public/*            │ /api/admin/*  (Supabase JWT)
┌───────────────▼──────────── BACKEND ─────▼───────────────┐
│  Route handlers: src/app/api/**     Logic: src/server/** │
│  AI quiz · Scoring quiz · Quiz leads · Books · Enquiries │
│  Settings/content · Admins · Inbox · Cron                │
└───────────────┬──────────────────────────┬───────────────┘
                │                          │
┌───────────────▼── DATABASE ──┐   ┌───────▼── EXTERNAL ────┐
│ Supabase Postgres + pgvector │   │ Groq, Gemini (AI)      │
│ supabase/migrations/0001–0004│   │ Cloudflare R2 (files)  │
└──────────────────────────────┘   │ SMTP (mail), WhatsApp  │
                                   └────────────────────────┘
```

Shared, isomorphic code (runs in browser and server): `src/lib/**`, `src/content/**`.

---

## 1. Frontend

### Web — the public site
| What | Where |
|---|---|
| Pages: home, `[slug]`, `ebooks/[slug]`, `download`, 404, OG image | `src/app/(site)/` |
| Sections (hero, services, about, faq, cta, intro…) | `src/components/*` |
| Quiz UI | `src/components/quiz/QuizBlock.tsx`, `QuizOverlay.tsx` |
| E-book shelf, 3D cover, lead form | `src/components/ebooks/*` |
| Enquiry → WhatsApp | `src/components/enquiry/*` |
| Browser → backend calls (one file) | `src/site/backend.ts` → `/api/public/*` |
| Built-in content defaults | `src/content/site.ts`, `defaults.ts`, `website.json` |
| SEO | `src/app/robots.ts`, `sitemap.ts`, `src/lib/seo/jsonld.ts` |

### Admin — the studio (`/admin`)
| Page | Route | Main code |
|---|---|---|
| Dashboard (KPIs, charts, AI health) | `admin/page.tsx` | `src/studio/dashboard/*`, `charts.tsx`, `AiHealth.tsx` |
| Books | `admin/books` | `src/studio/books/BookEditor.tsx`, `upload.ts`, `useFileUrl.ts` |
| Inbox (leads) | `admin/inbox` | `src/studio/inbox/LeadDrawer.tsx`, `leads.ts` |
| Quiz (questions, AI, KB, test) | `admin/quiz` | page file + `AiHealth.tsx` |
| Settings | `admin/settings` | `src/studio/settings/sections.tsx` |
| Shell, sign-in, publish bar, ⌘K | `admin/layout.tsx` | `Shell.tsx`, `SignIn.tsx`, `PublishBar.tsx`, `CommandPalette.tsx` |
| Draft state + API client | — | `store.ts`, `state.ts`, `api.ts`, `supabase.ts` |

---

## 2. Backend

Route handlers live in `src/app/api/**` and stay thin; the logic lives in `src/server/**` (all `server-only`).

### AI quiz (RAG)
- **Visitor:** `POST /api/public/quiz-ai`
- **Admin:** `/api/admin/ai/health`, `/api/admin/ai/test`, `/api/admin/kb`, `/api/admin/kb/[id]`, `/api/admin/kb/reindex`
- **Code:** `src/server/ai/chain.ts` (Groq → Gemini → scoring backup → last resort), `run.ts` (real deps + telemetry), `providers.ts`, `kb.ts`; result contract `src/lib/quiz/result.ts`, `types.ts`
- **Tables:** `kb_entries` (pgvector, `match_kb()`), `ai_calls`
- **Spec:** `docs/AI_RAG_SYSTEM.md`

### Scoring quiz (non-AI)
- **Code:** `src/lib/quiz/backup.ts` — runs in the browser and as layer 3 of the AI chain. "Scoring only" mode in Admin → Quiz → AI uses it alone.
- `src/lib/quiz/migrate.ts` turns old weights into the new mapping; `analyze.ts` makes random test visitors.
- Old weighted scorer: `archive/quiz-scoring-legacy/` (not built).

### Quiz leads
- `POST /api/public/quiz-results`, `/quiz-results/action`, `/quiz-email`
- **Code:** `src/server/leads.ts`, `src/lib/quiz/mail.ts`, `whatsapp.ts`
- **Table:** `quiz_results`

### Books (e-books)
- **Visitor:** `POST /api/public/ebook-requests`, `GET /api/public/download`, `GET /media/[...key]`
- **Admin:** `POST /api/admin/uploads`
- **Code:** `src/server/ebooks.ts` (signed links, download limits, delivery), `r2.ts` (+ `devStorage.ts` locally), `mail.ts`, `src/lib/ebooks/mail.ts`
- **Table:** `book_requests`, `use_download()`; files in R2

### Enquiries
- `POST /api/public/enquiries` → `src/server/leads.ts` → `enquiries`

### Settings / content (draft → publish)
- `/api/admin/draft`, `publish`, `backup`, `restore`, `reset`, `sample`, `bootstrap`
- **Code:** `src/server/content.ts` (read/write workspace, 60s memo of published), `backup.ts`; `src/lib/workspace.ts`, `checks.ts`, `diff.ts`
- **Tables:** `workspace` (rows `draft` and `published`), `versions`

### Admins & auth
- `/api/admin/admins`, `/api/admin/admins/[id]`
- **Code:** `src/server/auth.ts` (Supabase JWT), `admins.ts`, `src/lib/permissions.ts`
- **Table:** `admins`

### Inbox
- `/api/admin/leads`, `/leads/[kind]/[id]`, `/leads/clear-samples`, `/outbox/[id]`
- **Table:** `outbox` (+ the three lead tables)

### Cron
- `custom-worker.js` runs `/api/cron/tick` every 15 min (`wrangler.jsonc`): retries pending e-book deliveries, prunes `rate_hits`.

### Shared plumbing
`guard.ts` (same-origin, size cap, zod, rate limit via `rate_hit()`), `http.ts`, `env.ts`, `db.ts`, `/api/health`.

---

## 3. Database — Supabase Postgres

| Migration | Adds |
|---|---|
| `0001_init.sql` | `workspace`, `versions`, `enquiries`, `book_requests`, `quiz_results`, `outbox`, `admins`, `rate_hits`; `rate_hit()`, `use_download()` |
| `0002_quiz_ai_result.sql` | AI result column on `quiz_results` |
| `0003_ai_kb.sql` | `vector` extension, `kb_entries`, `match_kb()` |
| `0004_ai_calls.sql` | `ai_calls` telemetry |

| Table | Owned by |
|---|---|
| `workspace`, `versions` | Settings / content |
| `quiz_results` | Quiz leads |
| `kb_entries`, `ai_calls` | AI quiz |
| `book_requests` | Books |
| `enquiries` | Enquiries |
| `outbox` | Inbox / mail |
| `admins` | Admins |
| `rate_hits` | Shared guard |

---

## 4. Deploy
`pnpm deploy` → OpenNext build → Cloudflare Worker `ninelabs` (`wrangler.jsonc`, `open-next.config.ts`). Secrets: see `.env.example` and `src/server/env.ts`.
