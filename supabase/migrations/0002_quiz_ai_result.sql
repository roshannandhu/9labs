-- Quiz leads carry the structured result (AI or backup) and the visitor's free-text/contact fields.
-- Knowledge base / pgvector / ai_calls come with the AI endpoint (docs/AI_RAG_SYSTEM.md §11 phases 4–5).
alter table public.quiz_results
  add column other  jsonb not null default '{}',
  add column name   text  not null default '',
  add column phone  text  not null default '',
  add column ai     jsonb,
  add column source text  not null default 'none' check (source in ('none', 'backup', 'groq', 'gemini'));
