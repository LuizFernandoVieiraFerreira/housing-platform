-- Phase 2: property search embeddings (pgvector) + semantic ranking in search_properties_hybrid

create extension if not exists vector with schema extensions;

create table public.property_search_embeddings (
  property_id uuid primary key references public.properties (id) on delete cascade,
  content text not null,
  content_hash text not null,
  embedding extensions.vector (1536) not null,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint property_search_embeddings_content_not_blank check (char_length(trim(content)) > 0),
  constraint property_search_embeddings_content_hash_not_blank check (char_length(trim(content_hash)) > 0)
);

create index property_search_embeddings_updated_at_idx on public.property_search_embeddings (updated_at desc);

create index property_search_embeddings_embedding_hnsw_idx
on public.property_search_embeddings
using hnsw (embedding extensions.vector_cosine_ops);

alter table public.property_search_embeddings enable row level security;

create policy "Embeddings for published properties are publicly readable"
on public.property_search_embeddings
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_search_embeddings.property_id
      and p.status = 'published'
      and p.deleted_at is null
  )
);

create policy "Service role manages property search embeddings"
on public.property_search_embeddings
for all
to service_role
using (true)
with check (true);

grant select on public.property_search_embeddings to anon, authenticated;
grant all on public.property_search_embeddings to service_role;

create or replace function public.build_property_search_document(p_property_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select trim(
    both
    from
      concat_ws(
        E'\n',
        'Title: ' || p.title,
        'Description: ' || p.description,
        'Type: ' || p.property_type::text,
        'District: ' || p.district || ', ' || p.city,
        'Station: ' || coalesce(p.nearest_station_name, 'unknown') || ' ('
        || coalesce(p.nearest_station_walk_min::text, '?') || ' min walk)',
        'Tags: ' || coalesce(array_to_string(p.tags, ', '), ''),
        'Amenities: ' || coalesce(
          (
            select string_agg(a.name, ', ' order by a.sort_order, a.name)
            from public.property_amenities pa
            inner join public.amenities a on a.id = pa.amenity_id
            where pa.property_id = p.id
          ),
          ''
        ),
        'Rooms: ' || coalesce(
          (
            select string_agg(
              r.name || ' ' || r.monthly_price_krw::text || ' KRW/mo, max ' || r.max_occupancy::text,
              '; '
              order by
                r.monthly_price_krw,
                r.name
            )
            from public.rooms r
            where r.property_id = p.id
              and r.deleted_at is null
              and r.status = 'available'
          ),
          ''
        ),
        'Min stay nights: ' || p.min_stay_nights::text
      )
  )
  from public.properties p
  where p.id = p_property_id
    and p.deleted_at is null;
$$;

grant execute on function public.build_property_search_document(uuid) to service_role;

drop function if exists public.search_properties(jsonb, integer, integer);
drop function if exists public.search_properties_hybrid(jsonb, integer, integer);

create or replace function public.search_properties_hybrid(
  p_filters jsonb default '{}'::jsonb,
  p_limit integer default 20,
  p_offset integer default 0,
  p_query_embedding extensions.vector (1536) default null,
  p_reference_embedding extensions.vector (1536) default null,
  p_match_threshold double precision default 0.55
)
returns table (
  id uuid,
  title text,
  slug text,
  property_type public.accommodation_type,
  district text,
  nearest_station_name text,
  monthly_price_min integer,
  tags text[],
  cover_storage_path text,
  cover_alt_text text,
  latitude double precision,
  longitude double precision,
  distance_meters double precision,
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = public, extensions
as $$
declare
  v_query text := nullif(trim(p_filters ->> 'query'), '');
  v_property_type public.accommodation_type;
  v_price_min integer;
  v_price_max integer;
  v_guests integer;
  v_check_in date;
  v_check_out date;
  v_stay_nights integer;
  v_sort text := coalesce(nullif(p_filters ->> 'sort', ''), 'recommended');
  v_center_lat double precision;
  v_center_lng double precision;
  v_north double precision;
  v_south double precision;
  v_east double precision;
  v_west double precision;
  v_has_bounds boolean := false;
  v_center geography;
  v_max_station_walk_min integer;
  v_amenity_slugs text[];
  v_exclude_property_ids uuid[];
  v_reference_property_id uuid;
  v_reference_embedding extensions.vector (1536) := p_reference_embedding;
  v_active_embedding extensions.vector (1536);
  v_use_semantic boolean := false;
begin
  if p_limit < 1 or p_limit > 100 then
    raise exception 'p_limit must be between 1 and 100';
  end if;

  if p_offset < 0 then
    raise exception 'p_offset must be >= 0';
  end if;

  if p_match_threshold < 0 or p_match_threshold > 1 then
    raise exception 'p_match_threshold must be between 0 and 1';
  end if;

  if nullif(p_filters ->> 'reference_property_id', '') is not null then
    v_reference_property_id := (p_filters ->> 'reference_property_id')::uuid;
  end if;

  if v_reference_embedding is null and v_reference_property_id is not null then
    select pse.embedding
    into v_reference_embedding
    from public.property_search_embeddings pse
    where pse.property_id = v_reference_property_id;
  end if;

  v_active_embedding := coalesce(p_query_embedding, v_reference_embedding);
  v_use_semantic := v_active_embedding is not null;

  if nullif(p_filters ->> 'property_type', '') is not null then
    v_property_type := (p_filters ->> 'property_type')::public.accommodation_type;
  end if;

  if nullif(p_filters ->> 'price_min', '') is not null then
    v_price_min := (p_filters ->> 'price_min')::integer;
  end if;

  if nullif(p_filters ->> 'price_max', '') is not null then
    v_price_max := (p_filters ->> 'price_max')::integer;
  end if;

  if nullif(p_filters ->> 'guests', '') is not null then
    v_guests := greatest((p_filters ->> 'guests')::integer, 1);
  end if;

  if nullif(p_filters ->> 'check_in', '') is not null then
    v_check_in := (p_filters ->> 'check_in')::date;
  end if;

  if nullif(p_filters ->> 'check_out', '') is not null then
    v_check_out := (p_filters ->> 'check_out')::date;
  end if;

  if v_check_in is not null and v_check_out is not null then
    v_stay_nights := v_check_out - v_check_in;

    if v_stay_nights <= 0 then
      raise exception 'check_out must be after check_in';
    end if;
  end if;

  if nullif(p_filters ->> 'center_lat', '') is not null
    and nullif(p_filters ->> 'center_lng', '') is not null then
    v_center_lat := (p_filters ->> 'center_lat')::double precision;
    v_center_lng := (p_filters ->> 'center_lng')::double precision;
    v_center := extensions.st_setsrid(
      extensions.st_makepoint(v_center_lng, v_center_lat),
      4326
    )::extensions.geography;
  end if;

  if nullif(p_filters ->> 'north', '') is not null
    and nullif(p_filters ->> 'south', '') is not null
    and nullif(p_filters ->> 'east', '') is not null
    and nullif(p_filters ->> 'west', '') is not null then
    v_north := (p_filters ->> 'north')::double precision;
    v_south := (p_filters ->> 'south')::double precision;
    v_east := (p_filters ->> 'east')::double precision;
    v_west := (p_filters ->> 'west')::double precision;
    v_has_bounds := true;
  end if;

  if nullif(p_filters ->> 'max_station_walk_min', '') is not null then
    v_max_station_walk_min := (p_filters ->> 'max_station_walk_min')::integer;

    if v_max_station_walk_min <= 0 then
      raise exception 'max_station_walk_min must be > 0';
    end if;
  end if;

  if p_filters ? 'amenity_slugs'
    and jsonb_typeof(p_filters -> 'amenity_slugs') = 'array'
    and jsonb_array_length(p_filters -> 'amenity_slugs') > 0 then
    select coalesce(array_agg(trim(value)), '{}')
    into v_amenity_slugs
    from jsonb_array_elements_text(p_filters -> 'amenity_slugs') as elements(value)
    where char_length(trim(value)) > 0;
  end if;

  if p_filters ? 'exclude_property_ids'
    and jsonb_typeof(p_filters -> 'exclude_property_ids') = 'array'
    and jsonb_array_length(p_filters -> 'exclude_property_ids') > 0 then
    select coalesce(array_agg(value::uuid), '{}')
    into v_exclude_property_ids
    from jsonb_array_elements_text(p_filters -> 'exclude_property_ids') as elements(value);
  end if;

  return query
  with filtered as (
    select
      p.id,
      p.title,
      p.slug,
      p.property_type,
      p.district,
      p.nearest_station_name,
      p.monthly_price_min,
      p.tags,
      cover.storage_path as cover_storage_path,
      cover.alt_text as cover_alt_text,
      extensions.st_y(p.location::extensions.geometry) as latitude,
      extensions.st_x(p.location::extensions.geometry) as longitude,
      case
        when v_center is not null and p.location is not null then
          extensions.st_distance(p.location, v_center)
        else null
      end as distance_meters,
      p.is_featured,
      p.published_at
    from public.properties p
    left join lateral (
      select pi.storage_path, pi.alt_text
      from public.property_images pi
      where pi.property_id = p.id
      order by pi.is_cover desc, pi.sort_order asc, pi.created_at asc
      limit 1
    ) cover on true
    where p.deleted_at is null
      and p.status = 'published'
      and p.monthly_price_min is not null
      and p.location is not null
      and (
        v_query is null
        or p.title ilike '%' || v_query || '%'
        or p.district ilike '%' || v_query || '%'
        or coalesce(p.nearest_station_name, '') ilike '%' || v_query || '%'
        or exists (
          select 1
          from unnest(p.tags) tag
          where tag ilike '%' || v_query || '%'
        )
      )
      and (v_property_type is null or p.property_type = v_property_type)
      and (v_price_min is null or p.monthly_price_min >= v_price_min)
      and (v_price_max is null or p.monthly_price_min <= v_price_max)
      and (
        v_stay_nights is null
        or p.min_stay_nights <= v_stay_nights
      )
      and (
        v_guests is null
        or exists (
          select 1
          from public.rooms r
          where r.property_id = p.id
            and r.deleted_at is null
            and r.status = 'available'
            and r.max_occupancy >= v_guests
            and (
              v_check_in is null
              or r.available_from is null
              or r.available_from <= v_check_in
            )
        )
      )
      and (
        not v_has_bounds
        or extensions.st_within(
          p.location::extensions.geometry,
          extensions.st_makeenvelope(v_west, v_south, v_east, v_north, 4326)
        )
      )
      and (
        v_max_station_walk_min is null
        or (
          p.nearest_station_walk_min is not null
          and p.nearest_station_walk_min <= v_max_station_walk_min
        )
      )
      and (
        v_amenity_slugs is null
        or cardinality(v_amenity_slugs) = 0
        or not exists (
          select 1
          from unnest(v_amenity_slugs) required_slug
          where not exists (
            select 1
            from public.property_amenities pa
            inner join public.amenities a on a.id = pa.amenity_id
            where pa.property_id = p.id
              and a.slug = required_slug
          )
        )
      )
      and (
        v_exclude_property_ids is null
        or cardinality(v_exclude_property_ids) = 0
        or not (p.id = any (v_exclude_property_ids))
      )
  ),
  scored as (
    select
      filtered.id,
      filtered.title,
      filtered.slug,
      filtered.property_type,
      filtered.district,
      filtered.nearest_station_name,
      filtered.monthly_price_min,
      filtered.tags,
      filtered.cover_storage_path,
      filtered.cover_alt_text,
      filtered.latitude,
      filtered.longitude,
      filtered.distance_meters,
      filtered.is_featured,
      filtered.published_at,
      case
        when v_use_semantic and pse.embedding is not null then
          1 - (pse.embedding <=> v_active_embedding)
        else null
      end as similarity
    from filtered
    left join public.property_search_embeddings pse on pse.property_id = filtered.id
    where (
      not v_use_semantic
      or (
        pse.embedding is not null
        and (1 - (pse.embedding <=> v_active_embedding)) >= p_match_threshold
      )
    )
  )
  select
    scored.id,
    scored.title,
    scored.slug,
    scored.property_type,
    scored.district,
    scored.nearest_station_name,
    scored.monthly_price_min,
    scored.tags,
    scored.cover_storage_path,
    scored.cover_alt_text,
    scored.latitude,
    scored.longitude,
    scored.distance_meters,
    count(*) over () as total_count
  from scored
  order by
    case
      when v_use_semantic and v_sort in ('recommended', 'semantic') then scored.similarity
    end desc nulls last,
    case when v_sort = 'price_asc' then scored.monthly_price_min end asc nulls last,
    case when v_sort = 'price_desc' then scored.monthly_price_min end desc nulls last,
    case when v_sort = 'distance' then scored.distance_meters end asc nulls last,
    scored.is_featured desc,
    scored.published_at desc nulls last,
    scored.title asc
  limit p_limit
  offset p_offset;
end;
$$;

create or replace function public.search_properties(
  p_filters jsonb default '{}'::jsonb,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  title text,
  slug text,
  property_type public.accommodation_type,
  district text,
  nearest_station_name text,
  monthly_price_min integer,
  tags text[],
  cover_storage_path text,
  cover_alt_text text,
  latitude double precision,
  longitude double precision,
  distance_meters double precision,
  total_count bigint
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select *
  from public.search_properties_hybrid(
    p_filters,
    p_limit,
    p_offset,
    null::extensions.vector (1536),
    null::extensions.vector (1536),
    0.55
  );
$$;

grant execute on function public.search_properties_hybrid(
  jsonb,
  integer,
  integer,
  extensions.vector,
  extensions.vector,
  double precision
) to anon, authenticated;

grant execute on function public.search_properties(jsonb, integer, integer) to anon, authenticated;
