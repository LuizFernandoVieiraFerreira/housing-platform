-- Phase 3: properties catalog — hosts, properties, rooms, images, amenities, storage, publish workflow

create extension if not exists postgis with schema extensions;

create type public.host_status as enum ('pending', 'active', 'suspended');

create type public.property_status as enum ('draft', 'pending_review', 'published', 'archived');

create type public.accommodation_type as enum (
  'share-house',
  'studio',
  'micro-studio',
  'multi-bedroom'
);

create type public.booking_mode as enum ('instant', 'request');

create type public.room_status as enum ('available', 'unavailable', 'archived');

create table public.hosts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  display_name text not null,
  status public.host_status not null default 'pending',
  verified_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint hosts_display_name_not_blank check (char_length(trim(display_name)) > 0)
);

create index hosts_status_idx on public.hosts (status)
where
  deleted_at is null;

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.hosts (id) on delete restrict,
  title text not null,
  slug text not null,
  description text not null,
  property_type public.accommodation_type not null,
  address_line1 text not null,
  address_line2 text,
  city text not null default 'Seoul',
  postal_code text,
  country text not null default 'KR',
  location extensions.geography (point, 4326),
  district text not null,
  nearest_station_name text,
  nearest_station_walk_min integer,
  status public.property_status not null default 'draft',
  booking_mode public.booking_mode not null default 'request',
  min_stay_nights integer not null default 30,
  monthly_price_min integer,
  is_featured boolean not null default false,
  tags text[] not null default '{}',
  published_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint properties_title_not_blank check (char_length(trim(title)) > 0),
  constraint properties_slug_not_blank check (char_length(trim(slug)) > 0),
  constraint properties_description_not_blank check (char_length(trim(description)) > 0),
  constraint properties_district_not_blank check (char_length(trim(district)) > 0),
  constraint properties_min_stay_nights_positive check (min_stay_nights > 0),
  constraint properties_monthly_price_min_positive check (
    monthly_price_min is null
    or monthly_price_min > 0
  ),
  constraint properties_nearest_station_walk_min_positive check (
    nearest_station_walk_min is null
    or nearest_station_walk_min > 0
  )
);

create unique index properties_slug_unique_idx on public.properties (slug)
where
  deleted_at is null;

create index properties_status_type_price_idx on public.properties (status, property_type, monthly_price_min)
where
  deleted_at is null;

create index properties_featured_idx on public.properties (is_featured, published_at desc)
where
  deleted_at is null
  and status = 'published';

create index properties_location_idx on public.properties using gist (location)
where
  deleted_at is null
  and status = 'published';

create index properties_search_idx on public.properties using gin (
  to_tsvector(
    'simple',
    coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(district, '')
  )
)
where
  deleted_at is null
  and status = 'published';

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  name text not null,
  room_type text,
  size_sqm numeric(8, 2),
  max_occupancy integer not null default 1,
  monthly_price_krw integer not null,
  status public.room_status not null default 'available',
  available_from date,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint rooms_name_not_blank check (char_length(trim(name)) > 0),
  constraint rooms_max_occupancy_positive check (max_occupancy > 0),
  constraint rooms_monthly_price_positive check (monthly_price_krw > 0),
  constraint rooms_size_sqm_positive check (
    size_sqm is null
    or size_sqm > 0
  )
);

create index rooms_property_id_idx on public.rooms (property_id)
where
  deleted_at is null;

create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  alt_text text,
  is_cover boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  constraint property_images_storage_path_not_blank check (char_length(trim(storage_path)) > 0)
);

create unique index property_images_one_cover_idx on public.property_images (property_id)
where
  is_cover = true;

create index property_images_property_sort_idx on public.property_images (property_id, sort_order);

create table public.room_images (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  alt_text text,
  is_cover boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  constraint room_images_storage_path_not_blank check (char_length(trim(storage_path)) > 0)
);

create index room_images_room_sort_idx on public.room_images (room_id, sort_order);

create table public.amenities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint amenities_slug_not_blank check (char_length(trim(slug)) > 0),
  constraint amenities_name_not_blank check (char_length(trim(name)) > 0)
);

create table public.property_amenities (
  property_id uuid not null references public.properties (id) on delete cascade,
  amenity_id uuid not null references public.amenities (id) on delete cascade,
  primary key (property_id, amenity_id)
);

create trigger hosts_set_updated_at
before update on public.hosts
for each row
execute function public.set_updated_at();

create trigger properties_set_updated_at
before update on public.properties
for each row
execute function public.set_updated_at();

create trigger rooms_set_updated_at
before update on public.rooms
for each row
execute function public.set_updated_at();

create or replace function public.current_host_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select h.id
  from public.hosts h
  where h.profile_id = (select auth.uid())
    and h.deleted_at is null
  limit 1;
$$;

create or replace function public.is_host_of_property(p_property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.properties p
    join public.hosts h on h.id = p.host_id
    where p.id = p_property_id
      and h.profile_id = (select auth.uid())
      and h.deleted_at is null
      and p.deleted_at is null
  );
$$;

create or replace function public.sync_property_monthly_price_min()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_property_id uuid;
begin
  target_property_id := coalesce(new.property_id, old.property_id);

  update public.properties
  set monthly_price_min = (
    select min(r.monthly_price_krw)
    from public.rooms r
    where r.property_id = target_property_id
      and r.deleted_at is null
      and r.status = 'available'
  )
  where id = target_property_id;

  return coalesce(new, old);
end;
$$;

create trigger rooms_sync_property_monthly_price_min
after insert
or update
or delete on public.rooms
for each row
execute function public.sync_property_monthly_price_min();

create or replace function public.submit_property_for_review(p_property_id uuid)
returns public.properties
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_property public.properties;
begin
  if not public.is_host_of_property(p_property_id) then
    raise exception 'Only the property host can submit for review';
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

create or replace function public.publish_property(p_property_id uuid)
returns public.properties
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_property public.properties;
begin
  if not public.is_admin() then
    raise exception 'Only admins can publish properties';
  end if;

  update public.properties
  set
    status = 'published',
    published_at = timezone('utc', now())
  where id = p_property_id
    and deleted_at is null
    and status = 'pending_review'
  returning * into updated_property;

  if updated_property.id is null then
    raise exception 'Property must be pending review before it can be published';
  end if;

  return updated_property;
end;
$$;

create or replace function public.reject_property_review(p_property_id uuid)
returns public.properties
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_property public.properties;
begin
  if not public.is_admin() then
    raise exception 'Only admins can reject property reviews';
  end if;

  update public.properties
  set status = 'draft'
  where id = p_property_id
    and deleted_at is null
    and status = 'pending_review'
  returning * into updated_property;

  if updated_property.id is null then
    raise exception 'Property must be pending review before it can be rejected';
  end if;

  return updated_property;
end;
$$;

alter table public.hosts enable row level security;
alter table public.properties enable row level security;
alter table public.rooms enable row level security;
alter table public.property_images enable row level security;
alter table public.room_images enable row level security;
alter table public.amenities enable row level security;
alter table public.property_amenities enable row level security;

create policy "Published properties are publicly readable"
on public.properties
for select
to anon, authenticated
using (
  deleted_at is null
  and status = 'published'
);

create policy "Hosts can view their own properties"
on public.properties
for select
to authenticated
using (
  deleted_at is null
  and public.is_host_of_property(id)
);

create policy "Admins can view all properties"
on public.properties
for select
to authenticated
using (
  deleted_at is null
  and public.is_admin()
);

create policy "Hosts can insert their own properties"
on public.properties
for insert
to authenticated
with check (
  deleted_at is null
  and host_id = public.current_host_id()
  and status = 'draft'
);

create policy "Hosts can update their own draft or pending properties"
on public.properties
for update
to authenticated
using (
  deleted_at is null
  and public.is_host_of_property(id)
  and status in ('draft', 'pending_review')
)
with check (
  deleted_at is null
  and public.is_host_of_property(id)
  and status in ('draft', 'pending_review')
);

create policy "Admins can manage all properties"
on public.properties
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Active hosts are publicly readable"
on public.hosts
for select
to anon, authenticated
using (
  deleted_at is null
  and status = 'active'
);

create policy "Hosts can view their own host profile"
on public.hosts
for select
to authenticated
using (
  deleted_at is null
  and profile_id = (select auth.uid())
);

create policy "Admins can manage hosts"
on public.hosts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Rooms of published properties are publicly readable"
on public.rooms
for select
to anon, authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.deleted_at is null
      and p.status = 'published'
  )
);

create policy "Hosts can manage rooms on their properties"
on public.rooms
for all
to authenticated
using (public.is_host_of_property(property_id))
with check (public.is_host_of_property(property_id));

create policy "Admins can manage all rooms"
on public.rooms
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Images of published properties are publicly readable"
on public.property_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.deleted_at is null
      and p.status = 'published'
  )
);

create policy "Hosts can manage images on their properties"
on public.property_images
for all
to authenticated
using (public.is_host_of_property(property_id))
with check (public.is_host_of_property(property_id));

create policy "Admins can manage all property images"
on public.property_images
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Images of published rooms are publicly readable"
on public.room_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.properties p on p.id = r.property_id
    where r.id = room_id
      and r.deleted_at is null
      and p.deleted_at is null
      and p.status = 'published'
  )
);

create policy "Hosts can manage images on their rooms"
on public.room_images
for all
to authenticated
using (
  exists (
    select 1
    from public.rooms r
    where r.id = room_id
      and public.is_host_of_property(r.property_id)
  )
)
with check (
  exists (
    select 1
    from public.rooms r
    where r.id = room_id
      and public.is_host_of_property(r.property_id)
  )
);

create policy "Admins can manage all room images"
on public.room_images
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Amenities are publicly readable"
on public.amenities
for select
to anon, authenticated
using (true);

create policy "Admins can manage amenities"
on public.amenities
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Amenities on published properties are publicly readable"
on public.property_amenities
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.deleted_at is null
      and p.status = 'published'
  )
);

create policy "Hosts can manage amenities on their properties"
on public.property_amenities
for all
to authenticated
using (public.is_host_of_property(property_id))
with check (public.is_host_of_property(property_id));

create policy "Admins can manage all property amenities"
on public.property_amenities
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'property-images',
    'property-images',
    true,
    52428800,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'room-images',
    'room-images',
    true,
    52428800,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do nothing;

create policy "Property images are publicly accessible"
on storage.objects
for select
to public
using (bucket_id = 'property-images');

create policy "Room images are publicly accessible"
on storage.objects
for select
to public
using (bucket_id = 'room-images');

create policy "Hosts can upload property images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'property-images'
  and public.is_host_of_property(((storage.foldername(name))[1])::uuid)
);

create policy "Hosts can update property images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'property-images'
  and public.is_host_of_property(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'property-images'
  and public.is_host_of_property(((storage.foldername(name))[1])::uuid)
);

create policy "Hosts can delete property images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'property-images'
  and public.is_host_of_property(((storage.foldername(name))[1])::uuid)
);

create policy "Hosts can upload room images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'room-images'
  and exists (
    select 1
    from public.rooms r
    where r.id = ((storage.foldername(name))[1])::uuid
      and public.is_host_of_property(r.property_id)
  )
);

create policy "Hosts can update room images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'room-images'
  and exists (
    select 1
    from public.rooms r
    where r.id = ((storage.foldername(name))[1])::uuid
      and public.is_host_of_property(r.property_id)
  )
)
with check (
  bucket_id = 'room-images'
  and exists (
    select 1
    from public.rooms r
    where r.id = ((storage.foldername(name))[1])::uuid
      and public.is_host_of_property(r.property_id)
  )
);

create policy "Hosts can delete room images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'room-images'
  and exists (
    select 1
    from public.rooms r
    where r.id = ((storage.foldername(name))[1])::uuid
      and public.is_host_of_property(r.property_id)
  )
);

create policy "Admins can manage property image storage"
on storage.objects
for all
to authenticated
using (
  bucket_id in ('property-images', 'room-images')
  and public.is_admin()
)
with check (
  bucket_id in ('property-images', 'room-images')
  and public.is_admin()
);

grant select on public.hosts to anon, authenticated;
grant select, insert, update on public.properties to authenticated;
grant select on public.properties to anon;
grant select on public.rooms to anon, authenticated;
grant select, insert, update, delete on public.rooms to authenticated;
grant select on public.property_images to anon, authenticated;
grant select, insert, update, delete on public.property_images to authenticated;
grant select on public.room_images to anon, authenticated;
grant select, insert, update, delete on public.room_images to authenticated;
grant select on public.amenities to anon, authenticated;
grant select, insert, update, delete on public.property_amenities to authenticated;
grant all on public.hosts to service_role;
grant all on public.properties to service_role;
grant all on public.rooms to service_role;
grant all on public.property_images to service_role;
grant all on public.room_images to service_role;
grant all on public.amenities to service_role;
grant all on public.property_amenities to service_role;

grant execute on function public.submit_property_for_review(uuid) to authenticated;
grant execute on function public.publish_property(uuid) to authenticated;
grant execute on function public.reject_property_review(uuid) to authenticated;
