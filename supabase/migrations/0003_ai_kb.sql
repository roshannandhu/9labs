-- Enable pgvector extension for AI RAG embeddings
create extension if not exists vector;

-- Knowledge base entries for AI RAG context grounding
create table if not exists public.kb_entries (
  id text primary key,
  kind text not null check (kind in ('service', 'pricing', 'faq', 'case', 'ebook', 'process', 'note')),
  title text not null,
  body text not null,
  tags text[] not null default '{}',
  service_slug text null,
  allow_prices boolean not null default false,
  enabled boolean not null default true,
  embedding vector(768),
  updated_at timestamptz not null default now(),
  updated_by text not null default ''
);

-- Enable RLS (server-only via service_role key)
alter table public.kb_entries enable row level security;

-- Cosine similarity index for vector search
create index if not exists kb_entries_embedding_idx on public.kb_entries
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- RPC for vector retrieval: matches top-k enabled entries ordered by cosine distance
create or replace function public.match_kb(
  query_embedding vector(768),
  match_count int default 5
)
returns table (
  id text,
  kind text,
  title text,
  body text,
  tags text[],
  service_slug text,
  allow_prices boolean,
  similarity float
)
language sql stable
as $$
  select
    id,
    kind,
    title,
    body,
    tags,
    service_slug,
    allow_prices,
    1 - (embedding <=> query_embedding) as similarity
  from public.kb_entries
  where enabled = true and embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;

revoke all on function public.match_kb(vector, int) from public, anon, authenticated;
grant execute on function public.match_kb(vector, int) to service_role;
