-- Newswire — initial schema
-- =========================

create extension if not exists pgcrypto;

-- ========== profiles ==========
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'author' check (role in ('admin', 'author')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ========== articles ==========
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  author_name text not null default 'Newswire Desk',
  title text not null,
  slug text not null unique,
  excerpt text not null default '',
  content text not null default '',
  cover_image_url text,
  category text not null default 'world'
    check (category in ('kenya','world','africa','business','tech','entertainment')),
  status text not null default 'draft'
    check (status in ('draft','pending','published','rejected')),
  is_featured boolean not null default false,
  is_breaking boolean not null default false,
  views integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_status_published_at_idx
  on public.articles (status, published_at desc);
create index if not exists articles_author_idx on public.articles (author_id);
create index if not exists articles_category_status_idx on public.articles (category, status);

-- ========== feed_sources ==========
create table if not exists public.feed_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null unique,
  region text not null default 'world' check (region in ('kenya','world')),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- ========== helper functions ==========
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- is_admin() is evaluated inside RLS policies, so every API role must be
-- able to execute it (it only returns a boolean, no data exposure).
grant execute on function public.is_admin() to anon, authenticated, service_role;

create or replace function public.increment_views(p_slug text)
returns void
language sql security definer set search_path = public
as $$
  update public.articles set views = views + 1
  where slug = p_slug and status = 'published';
$$;

grant execute on function public.increment_views(text) to anon, authenticated;

-- ========== triggers ==========
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.articles_before_write()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_name text;
begin
  select coalesce(nullif(full_name, ''), 'Newswire Desk')
    into v_name
    from public.profiles
   where id = new.author_id;
  new.author_name := coalesce(v_name, 'Newswire Desk');

  if tg_op = 'INSERT' then
    -- clients: only admins may publish directly. The server (service_role,
    -- e.g. seed script or admin API) is trusted and may insert published rows.
    if new.status not in ('draft', 'pending')
       and not public.is_admin()
       and coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
      raise exception 'Only admins can publish directly';
    end if;
    if new.author_id <> auth.uid() and not public.is_admin() then
      raise exception 'Cannot create articles for another author';
    end if;
  end if;

  if tg_op = 'UPDATE'
     and new.author_id = auth.uid()
     and not public.is_admin() then
    if new.status is distinct from old.status
       or new.is_featured is distinct from old.is_featured
       or new.is_breaking is distinct from old.is_breaking
       or new.author_id is distinct from old.author_id
       or new.published_at is distinct from old.published_at then
      raise exception 'Authors cannot change publication state';
    end if;
  end if;

  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists articles_before_write on public.articles;
create trigger articles_before_write
  before insert or update on public.articles
  for each row execute function public.articles_before_write();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ========== row level security ==========
alter table public.profiles enable row level security;
alter table public.articles enable row level security;
alter table public.feed_sources enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- profiles / feed_sources: written only via service_role (server side)

drop policy if exists articles_select on public.articles;
create policy articles_select on public.articles
  for select to anon, authenticated
  using (status = 'published' or author_id = auth.uid() or public.is_admin());

drop policy if exists articles_insert_author on public.articles;
create policy articles_insert_author on public.articles
  for insert to authenticated
  with check (author_id = auth.uid() and status in ('draft', 'pending'));

drop policy if exists articles_insert_admin on public.articles;
create policy articles_insert_admin on public.articles
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists articles_update on public.articles;
create policy articles_update on public.articles
  for update to authenticated
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

drop policy if exists articles_delete on public.articles;
create policy articles_delete on public.articles
  for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- ========== data API grants ==========
-- Project was created WITHOUT "automatically expose new tables",
-- so grant explicitly to the Data API roles.
grant usage on schema public to anon, authenticated, service_role;
grant select on public.profiles to authenticated, service_role;
grant insert, update, delete on public.profiles to service_role;
grant select on public.articles to anon, authenticated, service_role;
grant insert, update, delete on public.articles to authenticated, service_role;
grant select on public.feed_sources to service_role;
grant insert, update, delete on public.feed_sources to service_role;

-- ========== seeded RSS feed sources ==========
insert into public.feed_sources (name, url, region) values
  ('KBC',          'https://www.kbc.co.ke/feed/', 'kenya'),
  ('The Standard', 'https://www.standardmedia.co.ke/rss/headlines.php', 'kenya'),
  ('Nation Africa','https://nation.africa/kenya/rss.xml', 'kenya'),
  ('Citizen Digital','https://citizen.digital/feed.xml', 'kenya'),
  ('Tuko News',    'https://news.google.com/rss/search?q=site:tuko.co.ke&hl=en-KE&gl=KE&ceid=KE:en', 'kenya'),
  ('The Star Kenya','https://news.google.com/rss/search?q=site:the-star.co.ke&hl=en-KE&gl=KE&ceid=KE:en', 'kenya'),
  ('BBC News',     'https://feeds.bbci.co.uk/news/rss.xml', 'world'),
  ('CNN',          'https://news.google.com/rss/search?q=site:cnn.com%20when:24h&hl=en-US&gl=US&ceid=US:en', 'world'),
  ('Al Jazeera',   'https://www.aljazeera.com/xml/rss/all.xml', 'world'),
  ('Sky News',     'https://feeds.skynews.com/feeds/rss/home.xml', 'world')
on conflict (url) do nothing;
