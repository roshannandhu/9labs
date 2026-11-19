-- AI provider keys managed from the admin (Quiz → Insights → AI keys). Two kinds of row:
--   source 'admin'  — a key added in the admin, stored encrypted (AES-GCM, key derived from APP_SECRET)
--   source 'secret' — settings for a key that lives in the Worker secrets / .env (GROQ_API_KEY,
--                     GEMINI_API_KEY): its label and on/off switch only, never the key itself
-- Keys are matched by a SHA-256 fingerprint; the admin only ever sees the last 4 characters.
-- Row level security on with no policies: only the server (service role) can read or write it.
create table if not exists public.ai_keys (
  id          uuid        primary key default gen_random_uuid(),
  provider    text        not null check (provider in ('groq', 'gemini')),
  source      text        not null check (source in ('admin', 'secret')),
  fingerprint text        not null unique,
  last4       text        not null default '',
  label       text        not null default '',
  key_enc     text,
  enabled     boolean     not null default true,
  created_at  timestamptz not null default now(),
  created_by  text        not null default ''
);
alter table public.ai_keys enable row level security;
