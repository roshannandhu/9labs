-- RLS is ON for every table with NO policies: the publishable key can read/write nothing.
-- Only the server (secret key) can. All access goes through the Next.js route handlers.

create table public.workspace (
  id         text primary key check (id in ('draft', 'published')),
  data       jsonb       not null,
  rev        integer     not null default 1,
  updated_at timestamptz not null default now(),
  updated_by text        not null default ''
);

create table public.versions (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by text        not null default '',
  summary    text[]      not null default '{}',
  data       jsonb       not null
);

create table public.enquiries (
  id            text primary key,
  ref           text        not null default '',
  name          text        not null,
  company       text        not null default '',
  service       text        not null,
  service_title text        not null default '',
  needs         text[]      not null default '{}',
  budget        text        not null default '',
  timeline      text        not null default '',
  message       text        not null default '',
  channel       text        not null check (channel in ('whatsapp', 'email')),
  status        text        not null default 'new',
  notes         text        not null default '',
  created_at    timestamptz not null default now()
);

create table public.book_requests (
  id              text primary key,
  name            text        not null,
  email           text        not null,
  phone           text        not null default '',
  company         text        not null default '',
  book_slug       text        not null,
  status          text        not null default 'pending' check (status in ('pending', 'sent', 'failed', 'rejected')),
  delivery_used   text        not null default '',
  sent_at         timestamptz,
  expires_at      timestamptz,
  downloads       integer     not null default 0,
  link_downloads  integer     not null default 0,
  token_version   integer     not null default 1,
  error           text        not null default '',
  notes           text        not null default '',
  consent         boolean     not null default true,
  source          text        not null default '',
  attempts        integer     not null default 0,
  last_attempt_at timestamptz,
  created_at      timestamptz not null default now()
);

create table public.quiz_results (
  id         text primary key,
  ref        text        not null unique,
  top        text        not null default '',
  matches    text        not null default '',
  summary    text        not null default '',
  answers    jsonb       not null default '{}',
  action     text        not null default 'none' check (action in ('none', 'whatsapp', 'email')),
  email      text        not null default '',
  status     text        not null default 'new',
  notes      text        not null default '',
  created_at timestamptz not null default now()
);

create table public.outbox (
  id         text primary key,
  kind       text        not null,
  to_email   text        not null,
  subject    text        not null,
  html       text        not null,
  text       text        not null default '',
  status     text        not null check (status in ('sent', 'failed', 'logged')),
  error      text        not null default '',
  created_at timestamptz not null default now()
);

create table public.admins (
  id            uuid        primary key default gen_random_uuid(),
  email         text        not null,
  name          text        not null default '',
  role          text        not null check (role in ('owner', 'admin', 'editor')),
  active        boolean     not null default true,
  last_login_at timestamptz,
  created_at    timestamptz not null default now()
);
create unique index admins_email_key on public.admins (lower(email));

create table public.rate_hits (
  key          text primary key,
  window_start timestamptz not null default now(),
  count        integer     not null default 1
);

create index enquiries_created_idx     on public.enquiries (created_at desc);
create index book_requests_created_idx on public.book_requests (created_at desc);
create index book_requests_email_idx   on public.book_requests (lower(email), book_slug, created_at desc);
create index book_requests_retry_idx   on public.book_requests (status, last_attempt_at) where status in ('pending', 'failed');
create index quiz_results_created_idx  on public.quiz_results (created_at desc);
create index quiz_results_email_idx    on public.quiz_results (lower(email), created_at desc) where email <> '';
create index outbox_created_idx        on public.outbox (created_at desc);
create index versions_created_idx      on public.versions (created_at desc);

alter table public.workspace     enable row level security;
alter table public.versions      enable row level security;
alter table public.enquiries     enable row level security;
alter table public.book_requests enable row level security;
alter table public.quiz_results  enable row level security;
alter table public.outbox        enable row level security;
alter table public.admins        enable row level security;
alter table public.rate_hits     enable row level security;

-- Fixed-window counter per key, atomically. Returns the count including this hit.
create function public.rate_hit(p_key text, p_window_seconds integer)
returns integer language sql set search_path = public as $$
  insert into rate_hits as r (key, window_start, count) values (p_key, now(), 1)
  on conflict (key) do update set
    count        = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.count + 1 end,
    window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning count;
$$;

-- Uses one download of a personal link, atomically. Returns the row, or nothing when the link is
-- not the current one, has expired, or has no downloads left.
create function public.use_download(p_id text, p_version integer, p_max integer)
returns setof public.book_requests language sql set search_path = public as $$
  update book_requests
     set downloads = downloads + 1, link_downloads = link_downloads + 1
   where id = p_id and status = 'sent' and token_version = p_version
     and link_downloads < p_max and (expires_at is null or expires_at > now())
  returning *;
$$;

revoke execute on function public.rate_hit(text, integer)               from public, anon, authenticated;
revoke execute on function public.use_download(text, integer, integer)  from public, anon, authenticated;
grant  execute on function public.rate_hit(text, integer)               to service_role;
grant  execute on function public.use_download(text, integer, integer)  to service_role;
