-- Phase 10: API rate limiting for booking quotes/holds

create table public.api_rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  primary key (bucket, window_start),
  constraint api_rate_limits_request_count_non_negative check (request_count >= 0)
);

create index api_rate_limits_window_start_idx on public.api_rate_limits (window_start);

create or replace function public.assert_rate_limit(
  p_bucket text,
  p_max_requests integer default 30,
  p_window_seconds integer default 60
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  if char_length(trim(p_bucket)) = 0 then
    raise exception 'Rate limit exceeded';
  end if;

  if p_max_requests <= 0 or p_window_seconds <= 0 then
    raise exception 'Rate limit exceeded';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from timezone('utc', now())) / p_window_seconds) * p_window_seconds
  );

  insert into public.api_rate_limits (bucket, window_start, request_count)
  values (trim(p_bucket), v_window_start, 1)
  on conflict (bucket, window_start)
  do update
  set request_count = public.api_rate_limits.request_count + 1
  returning request_count into v_count;

  if v_count > p_max_requests then
    raise exception 'Rate limit exceeded';
  end if;
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
volatile
security invoker
set search_path = public
as $$
declare
  v_inputs record;
  v_price record;
  v_actor text := coalesce((select auth.uid())::text, 'anon');
begin
  perform public.assert_rate_limit('quote:' || v_actor, 60, 60);

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

  perform public.assert_rate_limit('booking_hold:' || v_user_id::text, 10, 60);

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

alter table public.api_rate_limits enable row level security;

grant all on public.api_rate_limits to service_role;
grant execute on function public.assert_rate_limit(text, integer, integer) to anon, authenticated;
