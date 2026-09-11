-- Phase 7: host registration, property location updates, submit validation

create or replace function public.register_as_host(p_display_name text)
returns public.hosts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_host public.hosts;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if char_length(trim(p_display_name)) = 0 then
    raise exception 'Display name is required';
  end if;

  select * into v_host
  from public.hosts h
  where h.profile_id = v_user_id
    and h.deleted_at is null;

  if v_host.id is not null then
    return v_host;
  end if;

  alter table public.profiles disable trigger profiles_protect_role;

  update public.profiles
  set role = 'host'
  where id = v_user_id;

  alter table public.profiles enable trigger profiles_protect_role;

  insert into public.hosts (profile_id, display_name, status)
  values (v_user_id, trim(p_display_name), 'pending')
  returning * into v_host;

  return v_host;
end;
$$;

create or replace function public.set_property_location(
  p_property_id uuid,
  p_latitude double precision,
  p_longitude double precision
)
returns public.properties
language plpgsql
security definer
set search_path = public
as $$
declare
  v_property public.properties;
begin
  if not public.is_host_of_property(p_property_id) then
    raise exception 'Only the property host can update location';
  end if;

  if p_latitude < -90 or p_latitude > 90 or p_longitude < -180 or p_longitude > 180 then
    raise exception 'Invalid coordinates';
  end if;

  update public.properties
  set location = extensions.st_setsrid(
    extensions.st_makepoint(p_longitude, p_latitude),
    4326
  )::extensions.geography
  where id = p_property_id
    and deleted_at is null
    and status in ('draft', 'pending_review')
  returning * into v_property;

  if v_property.id is null then
    raise exception 'Property location cannot be updated';
  end if;

  return v_property;
end;
$$;

create or replace function public.submit_property_for_review(p_property_id uuid)
returns public.properties
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_property public.properties;
  v_room_count integer;
begin
  if not public.is_host_of_property(p_property_id) then
    raise exception 'Only the property host can submit for review';
  end if;

  select count(*) into v_room_count
  from public.rooms r
  where r.property_id = p_property_id
    and r.deleted_at is null
    and r.status = 'available';

  if v_room_count = 0 then
    raise exception 'Add at least one available room before submitting';
  end if;

  if not exists (
    select 1
    from public.properties p
    where p.id = p_property_id
      and p.location is not null
  ) then
    raise exception 'Geocode the property address before submitting';
  end if;

  update public.properties
  set status = 'pending_review'
  where id = p_property_id
    and deleted_at is null
    and status = 'draft'
  returning * into updated_property;

  if updated_property.id is null then
    raise exception 'Property must be in draft status to submit for review';
  end if;

  return updated_property;
end;
$$;

grant execute on function public.register_as_host(text) to authenticated;
grant execute on function public.set_property_location(uuid, double precision, double precision) to authenticated;

create or replace function public.get_host_property_coordinates(p_property_id uuid)
returns table (
  latitude double precision,
  longitude double precision
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    extensions.st_y(p.location::extensions.geometry) as latitude,
    extensions.st_x(p.location::extensions.geometry) as longitude
  from public.properties p
  where p.id = p_property_id
    and p.deleted_at is null
    and public.is_host_of_property(p.id)
    and p.location is not null;
$$;

grant execute on function public.get_host_property_coordinates(uuid) to authenticated;
