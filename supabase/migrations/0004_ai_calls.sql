-- One row per AI quiz run (docs/AI_RAG_SYSTEM.md §4). Never holds client text — only the outcome,
-- timings, token counts and the provider's own rate-limit numbers. Pruned after 30 days by cron/tick.
create table if not exists public.ai_calls (
  id                    text primary key,
  at                    timestamptz not null default now(),
  provider              text        not null check (provider in ('groq', 'gemini', 'backup')),
  outcome               text        not null check (outcome in ('ok', 'failover', 'backup', 'none')),
  reason                text        not null default '',
  detail                text        not null default '',
  tried                 text[]      not null default '{}',
  latency_ms            integer     not null default 0,
  tokens_in             integer     not null default 0,
  tokens_out            integer     not null default 0,
  rl_remaining_requests integer,
  rl_remaining_tokens   integer,
  rl_reset_at           timestamptz,
  retrieval             text        not null default 'skipped',
  ref                   text        not null default ''
);
create index if not exists ai_calls_at_idx on public.ai_calls (at desc);
alter table public.ai_calls enable row level security;
