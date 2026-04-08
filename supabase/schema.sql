create table if not exists public.wine_entries (
  id text primary key,
  name text not null,
  description text not null,
  category text not null,
  tags text[] not null default '{}',
  color text not null,
  icon text,
  "tileCallback" text,
  "iconCallback" text,
  "wineType" text,
  "tastingProfile" jsonb,
  climate text,
  "climateDescription" text,
  details jsonb not null default '{}'::jsonb,
  rarity text,
  "grapeCard" jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wine_entries_category_idx on public.wine_entries (category);
create index if not exists wine_entries_name_idx on public.wine_entries (name);
create index if not exists wine_entries_climate_idx on public.wine_entries (climate);
create index if not exists wine_entries_tags_gin_idx on public.wine_entries using gin (tags);
create index if not exists wine_entries_details_gin_idx on public.wine_entries using gin (details);
create index if not exists wine_entries_grape_card_gin_idx on public.wine_entries using gin ("grapeCard");

create extension if not exists pg_trgm;
create index if not exists wine_entries_name_trgm_idx on public.wine_entries using gin (name gin_trgm_ops);

create or replace function public.set_wine_entries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_wine_entries_updated_at on public.wine_entries;
create trigger set_wine_entries_updated_at
before update on public.wine_entries
for each row
execute function public.set_wine_entries_updated_at();
