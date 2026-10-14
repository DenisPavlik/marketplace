-- Search ranking: a "relevance" sort (Best match) that puts title matches first and
-- orders the rest by full-text rank, instead of treating a passing mention in a
-- description the same as the item itself.

create or replace function public.search_listings(
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
      websearch_to_tsquery('english', coalesce(nullif(trim(q), ''), '')) as tsq,
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
    -- Best match: title hits first, then full-text rank (title outweighs description),
    -- so a listing that only mentions the word in passing sinks to the end.
    case when sort = 'relevance' and p.term is not null then
      (l.title ilike '%' || replace(replace(replace(p.term, '\', '\\'), '%', '\%'), '_', '\_') || '%')::int
    end desc nulls last,
    case when sort = 'relevance' and p.term is not null then ts_rank_cd(l.search, p.tsq) end desc nulls last,
    case when sort = 'price_asc' then l.price end asc nulls last,
    case when sort = 'price_desc' then l.price end desc nulls last,
    case when sort = 'nearest' and p.origin is not null
      then extensions.st_distance(l.location, p.origin) end asc nulls last,
    l.created_at desc,
    l.id
  limit least(greatest(page_limit, 1), 48)
  offset greatest(page_offset, 0);
$$;
