-- search_properties RPC for map/list discovery

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
begin
  if p_limit < 1 or p_limit > 100 then
    raise exception 'p_limit must be between 1 and 100';
  end if;

  if p_offset < 0 then
    raise exception 'p_offset must be >= 0';
  end if;

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
  )
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
    count(*) over () as total_count
  from filtered
  order by
    case when v_sort = 'price_asc' then filtered.monthly_price_min end asc nulls last,
    case when v_sort = 'price_desc' then filtered.monthly_price_min end desc nulls last,
    case when v_sort = 'distance' then filtered.distance_meters end asc nulls last,
    filtered.is_featured desc,
    filtered.published_at desc nulls last,
    filtered.title asc
  limit p_limit
  offset p_offset;
end;
$$;

create or replace function public.get_property_coordinates(p_property_id uuid)
returns table (
  latitude double precision,
  longitude double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    extensions.st_y(p.location::extensions.geometry) as latitude,
    extensions.st_x(p.location::extensions.geometry) as longitude
  from public.properties p
  where p.id = p_property_id
    and p.deleted_at is null
    and p.status = 'published'
    and p.location is not null;
$$;

grant execute on function public.search_properties(jsonb, integer, integer) to anon, authenticated;
grant execute on function public.get_property_coordinates(uuid) to anon, authenticated;
