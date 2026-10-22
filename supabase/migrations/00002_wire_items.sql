-- Newswire — wire_items: RSS headlines cached for on-site reading with attribution
-- ==============================================================================

create table if not exists public.wire_items (
  id uuid primary key default gen_random_uuid(),
  unique_key text not null unique,
  region text not null default 'world' check (region in ('kenya', 'world')),
  source text not null,
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  image_url text,
  external_url text not null,
  published_at timestamptz,
  fetched_at timestamptz not null default now()
);

create index if not exists wire_items_region_published_idx
  on public.wire_items (region, published_at desc);

alter table public.wire_items enable row level security;

drop policy if exists wire_items_select on public.wire_items;
create policy wire_items_select on public.wire_items
  for select to anon, authenticated
  using (true);

-- writes happen only through the service role (server side)
grant select on public.wire_items to anon, authenticated, service_role;
grant insert, update, delete on public.wire_items to service_role;
