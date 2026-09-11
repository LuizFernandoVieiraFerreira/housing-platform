-- Phase 5: bookings, pricing snapshots, holds, and conflict prevention

create extension if not exists btree_gist with schema extensions;

create type public.booking_status as enum (
  'requested',
  'pending_payment',
  'expired',
  'confirmed',
  'payment_failed',
  'active',
  'completed',
  'cancelled',
  'rejected'
);

create type public.booking_type as enum ('instant', 'request');

create table public.platform_settings (
  id smallint primary key,
  service_fee_bps integer not null default 1000,
  hold_ttl_minutes integer not null default 15,
  pricing_version text not null default 'v1',
  updated_at timestamptz not null default timezone('utc', now()),
  constraint platform_settings_service_fee_bps_valid check (
    service_fee_bps >= 0
    and service_fee_bps <= 10000
  ),
  constraint platform_settings_hold_ttl_positive check (hold_ttl_minutes > 0),
  constraint platform_settings_pricing_version_not_blank check (char_length(trim(pricing_version)) > 0)
);

insert into public.platform_settings (id, service_fee_bps, hold_ttl_minutes, pricing_version)
values (1, 1000, 15, 'v1')
on conflict (id) do nothing;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete restrict,
  room_id uuid not null references public.rooms (id) on delete restrict,
  property_id uuid not null references public.properties (id) on delete restrict,
  check_in date not null,
  check_out date not null,
  guest_count integer not null,
  status public.booking_status not null,
  booking_type public.booking_type not null,
  hold_expires_at timestamptz,
  customer_notes text,
  approved_at timestamptz,
  approved_by uuid references public.profiles (id) on delete set null,
  cancelled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint bookings_check_out_after_check_in check (check_out > check_in),
  constraint bookings_guest_count_positive check (guest_count > 0),
  constraint bookings_hold_expires_when_pending check (
    status <> 'pending_payment'
    or hold_expires_at is not null
  )
);

create index bookings_room_dates_idx on public.bookings (room_id, check_in, check_out);

create index bookings_customer_status_idx on public.bookings (customer_id, status);

create index bookings_status_hold_expires_idx on public.bookings (status, hold_expires_at)
where
  status = 'pending_payment';

alter table public.bookings
add constraint bookings_no_overlap
exclude using gist (
  room_id with =,
  daterange(check_in, check_out, '[)') with &&
)
where (
  status in ('pending_payment', 'confirmed', 'active')
);

create table public.booking_price_snapshots (
  booking_id uuid primary key references public.bookings (id) on delete cascade,
  rent_krw integer not null,
  service_fee_krw integer not null,
  utilities_krw integer not null default 0,
  total_krw integer not null,
  pricing_version text not null,
  nightly_breakdown jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint booking_price_snapshots_rent_positive check (rent_krw > 0),
  constraint booking_price_snapshots_service_fee_non_negative check (service_fee_krw >= 0),
  constraint booking_price_snapshots_total_positive check (total_krw > 0)
);

create trigger bookings_set_updated_at
before update on public.bookings
for each row
execute function public.set_updated_at();

create or replace function public.get_platform_settings()
returns public.platform_settings
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.platform_settings
  where id = 1;
$$;

create or replace function public.calculate_booking_price(
  p_monthly_price_krw integer,
  p_nights integer,
  p_service_fee_bps integer default 1000
)
returns table (
  rent_krw integer,
  service_fee_krw integer,
  total_krw integer,
  pricing_version text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_settings public.platform_settings;
  v_rent numeric;
  v_service_fee numeric;
begin
  if p_monthly_price_krw <= 0 then
    raise exception 'Monthly price must be positive';
  end if;

  if p_nights <= 0 then
    raise exception 'Stay length must be positive';
  end if;

  select * into v_settings from public.get_platform_settings();

  v_rent := floor(((p_monthly_price_krw::numeric / 30) * p_nights) / 1000) * 1000;
  v_service_fee := floor((v_rent * coalesce(p_service_fee_bps, v_settings.service_fee_bps)::numeric / 10000) / 1000) * 1000;

  return query
  select
    v_rent::integer,
    v_service_fee::integer,
    (v_rent + v_service_fee)::integer,
    v_settings.pricing_version;
end;
$$;

create or replace function public.is_host_of_booking(p_booking_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bookings b
    where b.id = p_booking_id
      and public.is_host_of_property(b.property_id)
  );
$$;

create or replace function public.validate_booking_inputs(
  p_room_id uuid,
  p_check_in date,
  p_check_out date,
  p_guest_count integer
)
returns table (
  room_id uuid,
  property_id uuid,
  booking_mode public.booking_mode,
  min_stay_nights integer,
  monthly_price_krw integer,
  max_occupancy integer,
  nights integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_room public.rooms;
  v_property public.properties;
  v_nights integer;
begin
  if p_check_out <= p_check_in then
    raise exception 'check_out must be after check_in';
  end if;

  if p_guest_count <= 0 then
    raise exception 'guest_count must be positive';
  end if;

  select * into v_room
  from public.rooms r
  where r.id = p_room_id
    and r.deleted_at is null
    and r.status = 'available';

  if v_room.id is null then
    raise exception 'Room is not available';
  end if;

  select * into v_property
  from public.properties p
  where p.id = v_room.property_id
    and p.deleted_at is null
    and p.status = 'published';

  if v_property.id is null then
    raise exception 'Property is not published';
  end if;

  v_nights := p_check_out - p_check_in;

  if v_nights < v_property.min_stay_nights then
    raise exception 'Stay must be at least % nights', v_property.min_stay_nights;
  end if;

  if p_guest_count > v_room.max_occupancy then
    raise exception 'Room supports up to % guests', v_room.max_occupancy;
  end if;

  if v_room.available_from is not null and v_room.available_from > p_check_in then
    raise exception 'Room is not available from the selected check-in date';
  end if;

  return query
  select
    v_room.id,
    v_property.id,
    v_property.booking_mode,
    v_property.min_stay_nights,
    v_room.monthly_price_krw,
    v_room.max_occupancy,
    v_nights;
end;
$$;

create or replace function public.quote_booking(
  p_room_id uuid,
  p_check_in date,
  p_check_out date,
  p_guest_count integer
)
returns table (
  room_id uuid,
  property_id uuid,
  booking_mode public.booking_mode,
  nights integer,
  rent_krw integer,
  service_fee_krw integer,
  total_krw integer,
  pricing_version text
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_inputs record;
  v_price record;
begin
  select * into v_inputs
  from public.validate_booking_inputs(p_room_id, p_check_in, p_check_out, p_guest_count);

  select * into v_price
  from public.calculate_booking_price(v_inputs.monthly_price_krw, v_inputs.nights);

  return query
  select
    v_inputs.room_id,
    v_inputs.property_id,
    v_inputs.booking_mode,
    v_inputs.nights,
    v_price.rent_krw,
    v_price.service_fee_krw,
    v_price.total_krw,
    v_price.pricing_version;
end;
$$;

create or replace function public.room_has_booking_conflict(
  p_room_id uuid,
  p_check_in date,
  p_check_out date
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bookings b
    where b.room_id = p_room_id
      and b.status in ('pending_payment', 'confirmed', 'active')
      and daterange(b.check_in, b.check_out, '[)') && daterange(p_check_in, p_check_out, '[)')
  );
$$;

create or replace function public.create_booking_hold(
  p_room_id uuid,
  p_check_in date,
  p_check_out date,
  p_guest_count integer,
  p_customer_notes text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_inputs record;
  v_price record;
  v_settings public.platform_settings;
  v_booking public.bookings;
  v_status public.booking_status;
  v_booking_type public.booking_type;
  v_hold_expires_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_inputs
  from public.validate_booking_inputs(p_room_id, p_check_in, p_check_out, p_guest_count);

  if public.room_has_booking_conflict(p_room_id, p_check_in, p_check_out) then
    raise exception 'Selected dates conflict with an existing booking hold';
  end if;

  select * into v_price
  from public.calculate_booking_price(v_inputs.monthly_price_krw, v_inputs.nights);

  select * into v_settings from public.get_platform_settings();

  if v_inputs.booking_mode = 'instant' then
    v_status := 'pending_payment';
    v_booking_type := 'instant';
    v_hold_expires_at := timezone('utc', now()) + make_interval(mins => v_settings.hold_ttl_minutes);
  else
    v_status := 'requested';
    v_booking_type := 'request';
    v_hold_expires_at := null;
  end if;

  insert into public.bookings (
    customer_id,
    room_id,
    property_id,
    check_in,
    check_out,
    guest_count,
    status,
    booking_type,
    hold_expires_at,
    customer_notes
  )
  values (
    v_user_id,
    v_inputs.room_id,
    v_inputs.property_id,
    p_check_in,
    p_check_out,
    p_guest_count,
    v_status,
    v_booking_type,
    v_hold_expires_at,
    nullif(trim(p_customer_notes), '')
  )
  returning * into v_booking;

  insert into public.booking_price_snapshots (
    booking_id,
    rent_krw,
    service_fee_krw,
    utilities_krw,
    total_krw,
    pricing_version,
    nightly_breakdown
  )
  values (
    v_booking.id,
    v_price.rent_krw,
    v_price.service_fee_krw,
    0,
    v_price.total_krw,
    v_price.pricing_version,
    jsonb_build_array(
      jsonb_build_object(
        'nights', v_inputs.nights,
        'monthly_price_krw', v_inputs.monthly_price_krw,
        'rent_krw', v_price.rent_krw,
        'service_fee_krw', v_price.service_fee_krw
      )
    )
  );

  return v_booking;
exception
  when exclusion_violation then
    raise exception 'Selected dates conflict with an existing booking hold';
end;
$$;

create or replace function public.approve_booking_request(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
  v_settings public.platform_settings;
begin
  if not (public.is_admin() or public.is_host_of_booking(p_booking_id)) then
    raise exception 'Only the host or an admin can approve booking requests';
  end if;

  if public.room_has_booking_conflict(
    (select room_id from public.bookings where id = p_booking_id),
    (select check_in from public.bookings where id = p_booking_id),
    (select check_out from public.bookings where id = p_booking_id)
  ) then
    raise exception 'Selected dates conflict with an existing booking hold';
  end if;

  select * into v_settings from public.get_platform_settings();

  update public.bookings
  set
    status = 'pending_payment',
    hold_expires_at = timezone('utc', now()) + make_interval(mins => v_settings.hold_ttl_minutes),
    approved_at = timezone('utc', now()),
    approved_by = auth.uid()
  where id = p_booking_id
    and status = 'requested'
  returning * into v_booking;

  if v_booking.id is null then
    raise exception 'Booking must be in requested status to approve';
  end if;

  return v_booking;
exception
  when exclusion_violation then
    raise exception 'Selected dates conflict with an existing booking hold';
end;
$$;

create or replace function public.reject_booking_request(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
begin
  if not (public.is_admin() or public.is_host_of_booking(p_booking_id)) then
    raise exception 'Only the host or an admin can reject booking requests';
  end if;

  update public.bookings
  set status = 'rejected'
  where id = p_booking_id
    and status = 'requested'
  returning * into v_booking;

  if v_booking.id is null then
    raise exception 'Booking must be in requested status to reject';
  end if;

  return v_booking;
end;
$$;

create or replace function public.cancel_own_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
begin
  update public.bookings
  set
    status = 'cancelled',
    cancelled_at = timezone('utc', now())
  where id = p_booking_id
    and customer_id = auth.uid()
    and status in ('requested', 'pending_payment')
  returning * into v_booking;

  if v_booking.id is null then
    raise exception 'Booking cannot be cancelled';
  end if;

  return v_booking;
end;
$$;

create or replace function public.expire_booking_holds()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.bookings
  set status = 'expired'
  where status = 'pending_payment'
    and hold_expires_at is not null
    and hold_expires_at <= timezone('utc', now());

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

alter table public.platform_settings enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_price_snapshots enable row level security;

create policy "Authenticated users can read platform settings"
on public.platform_settings
for select
to authenticated
using (true);

create policy "Admins can manage platform settings"
on public.platform_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Customers can view their own bookings"
on public.bookings
for select
to authenticated
using (customer_id = (select auth.uid()));

create policy "Hosts can view bookings on their properties"
on public.bookings
for select
to authenticated
using (public.is_host_of_property(property_id));

create policy "Admins can view all bookings"
on public.bookings
for select
to authenticated
using (public.is_admin());

create policy "Customers can create their own bookings via RPC"
on public.bookings
for insert
to authenticated
with check (customer_id = (select auth.uid()));

create policy "Admins can manage all bookings"
on public.bookings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Customers can view their booking price snapshots"
on public.booking_price_snapshots
for select
to authenticated
using (
  exists (
    select 1
    from public.bookings b
    where b.id = booking_id
      and (
        b.customer_id = (select auth.uid())
        or public.is_host_of_property(b.property_id)
        or public.is_admin()
      )
  )
);

grant select on public.platform_settings to authenticated;
grant select, insert, update on public.bookings to authenticated;
grant select on public.booking_price_snapshots to authenticated;
grant all on public.platform_settings to service_role;
grant all on public.bookings to service_role;
grant all on public.booking_price_snapshots to service_role;

grant execute on function public.quote_booking(uuid, date, date, integer) to anon, authenticated;
grant execute on function public.create_booking_hold(uuid, date, date, integer, text) to authenticated;
grant execute on function public.approve_booking_request(uuid) to authenticated;
grant execute on function public.reject_booking_request(uuid) to authenticated;
grant execute on function public.cancel_own_booking(uuid) to authenticated;
grant execute on function public.expire_booking_holds() to service_role;
