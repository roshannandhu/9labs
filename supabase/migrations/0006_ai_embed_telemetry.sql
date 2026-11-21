-- Count the Gemini embedding request each quiz run makes during retrieval, so the admin's Gemini
-- quota reflects real usage (every run embeds the query; those requests were invisible before).
-- One extra integer per ai_calls row: how many embedding requests that run spent (0 or 1 today).
alter table public.ai_calls add column if not exists embed_requests integer not null default 0;
