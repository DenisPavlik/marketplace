-- Core marketplace schema: profiles, listings, favorites, search.

create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users, created by trigger on sign-up)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  avatar_url text check (char_length(avatar_url) <= 500),
  bio text check (char_length(bio) <= 500),
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(new.email, '@', 1), ''),
      'User'
    ), 60),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Listings
-- ---------------------------------------------------------------------------

-- Images are stored as ImageKit paths only; URLs are always built from our own
-- endpoint, so a listing can never point at an arbitrary host.
create function public.is_valid_listing_images(imgs jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(imgs) = 'array'
    and jsonb_array_length(imgs) between 1 and 10
    and not exists (
      select 1
      from jsonb_array_elements(imgs) as e
      where jsonb_typeof(e) <> 'object'
        or coalesce(jsonb_typeof(e -> 'fileId'), '') <> 'string'
        or coalesce(jsonb_typeof(e -> 'path'), '') <> 'string'
        or left(e ->> 'path', 1) <> '/'
        or char_length(e ->> 'path') > 300
    );
$$;

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 100),
  description text not null default '' check (char_length(description) <= 5000),
  price numeric(12, 2) not null check (price >= 0 and price < 10000000),
  category text not null check (category in (
    'vehicles', 'property', 'electronics', 'home', 'fashion',
    'kids', 'sports', 'hobbies', 'pets', 'misc'
  )),
  condition text check (condition in ('new', 'like_new', 'good', 'fair')),
  status text not null default 'active' check (status in ('active', 'reserved', 'sold')),
  images jsonb not null check (public.is_valid_listing_images(images)),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  location extensions.geography(point, 4326) generated always as (
    extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography
  ) stored,
  location_name text check (char_length(location_name) <= 120),
  search tsvector generated always as (
    setweight(to_tsvector('english', title), 'A') ||
    setweight(to_tsvector('english', description), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_location_idx on public.listings using gist (location);
create index listings_search_idx on public.listings using gin (search);
create index listings_title_trgm_idx on public.listings using gin (title extensions.gin_trgm_ops);
create index listings_feed_idx on public.listings (status, created_at desc);
create index listings_category_idx on public.listings (category, created_at desc);
create index listings_seller_idx on public.listings (seller_id, created_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_set_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Favorites
-- ---------------------------------------------------------------------------
create table public.favorites (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index favorites_listing_idx on public.favorites (listing_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.favorites enable row level security;

create policy "Profiles are public"
  on public.profiles for select to anon, authenticated using (true);
create policy "Users update own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Listings are public"
  on public.listings for select to anon, authenticated using (true);
create policy "Users create own listings"
  on public.listings for insert to authenticated
  with check ((select auth.uid()) = seller_id);
create policy "Sellers update own listings"
  on public.listings for update to authenticated
  using ((select auth.uid()) = seller_id) with check ((select auth.uid()) = seller_id);
create policy "Sellers delete own listings"
  on public.listings for delete to authenticated
  using ((select auth.uid()) = seller_id);

create policy "Users see own favorites"
  on public.favorites for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users add own favorites"
  on public.favorites for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users remove own favorites"
  on public.favorites for delete to authenticated using ((select auth.uid()) = user_id);

-- Column-level guards: ownership and timestamps are never client-writable.
revoke update on public.profiles from anon, authenticated;
grant update (display_name, avatar_url, bio) on public.profiles to authenticated;

revoke update on public.listings from anon, authenticated;
grant update (title, description, price, category, condition, status, images, lat, lng, location_name)
  on public.listings to authenticated;

revoke insert, update, delete on public.profiles from anon;
revoke insert, update, delete on public.listings from anon;
revoke insert, update, delete on public.favorites from anon;

-- ---------------------------------------------------------------------------
-- Search
-- ---------------------------------------------------------------------------
create function public.search_listings(
  q text default null,
  cat text default null,
  min_price numeric default null,
  max_price numeric default null,
  near_lat double precision default null,
  near_lng double precision default null,
  radius_km double precision default null,
  sort text default 'newest',
  page_limit integer default 24,
  page_offset integer default 0
)
returns table (
  id uuid,
  title text,
  price numeric,
  category text,
  condition text,
  status text,
  images jsonb,
  location_name text,
  lat double precision,
  lng double precision,
  created_at timestamptz,
  distance_km double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  with params as (
    select
      nullif(trim(q), '') as term,
      case
        when near_lat is not null and near_lng is not null
          then extensions.st_setsrid(extensions.st_makepoint(near_lng, near_lat), 4326)::extensions.geography
      end as origin
  )
  select
    l.id, l.title, l.price, l.category, l.condition, l.status, l.images,
    l.location_name, l.lat, l.lng, l.created_at,
    case when p.origin is not null then extensions.st_distance(l.location, p.origin) / 1000 end as distance_km
  from public.listings l
  cross join params p
  where l.status in ('active', 'reserved')
    and (p.term is null
      or l.search @@ websearch_to_tsquery('english', p.term)
      or l.title ilike '%' || replace(replace(replace(p.term, '\', '\\'), '%', '\%'), '_', '\_') || '%')
    and (cat is null or l.category = cat)
    and (min_price is null or l.price >= min_price)
    and (max_price is null or l.price <= max_price)
    and (p.origin is null or radius_km is null
      or extensions.st_dwithin(l.location, p.origin, radius_km * 1000))
  order by
    case when sort = 'price_asc' then l.price end asc nulls last,
    case when sort = 'price_desc' then l.price end desc nulls last,
    case when sort = 'nearest' and p.origin is not null
      then extensions.st_distance(l.location, p.origin) end asc nulls last,
    l.created_at desc,
    l.id
  limit least(greatest(page_limit, 1), 48)
  offset greatest(page_offset, 0);
$$;

grant execute on function public.search_listings to anon, authenticated;
