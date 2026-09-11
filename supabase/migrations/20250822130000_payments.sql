-- Phase 6: Toss Payments — payment records, webhook audit, confirmation RPCs

create type public.payment_status as enum ('pending', 'confirmed', 'failed', 'cancelled');

alter table public.bookings
add column payment_retry_count integer not null default 0;

alter table public.bookings
add constraint bookings_payment_retry_count_non_negative check (payment_retry_count >= 0);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  payment_key text,
  booking_id uuid not null references public.bookings (id) on delete restrict,
  customer_id uuid not null references public.profiles (id) on delete restrict,
  amount_krw integer not null,
  status public.payment_status not null default 'pending',
  toss_response jsonb,
  failed_reason text,
  confirmed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint payments_order_id_unique unique (order_id),
  constraint payments_amount_positive check (amount_krw > 0)
);

create unique index payments_payment_key_unique_idx on public.payments (payment_key)
where
  payment_key is not null;

create index payments_booking_id_idx on public.payments (booking_id);

create index payments_customer_id_idx on public.payments (customer_id);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  payment_id uuid references public.payments (id) on delete set null,
  booking_id uuid references public.bookings (id) on delete set null,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz not null default timezone('utc', now()),
  constraint payment_events_event_id_unique unique (event_id)
);

create trigger payments_set_updated_at
before update on public.payments
for each row
execute function public.set_updated_at();

create or replace function public.create_payment_order(p_booking_id uuid)
returns table (
  payment_id uuid,
  order_id uuid,
  booking_id uuid,
  amount_krw integer,
  order_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.bookings;
  v_snapshot public.booking_price_snapshots;
  v_settings public.platform_settings;
  v_payment public.payments;
  v_order_id uuid := gen_random_uuid();
  v_property_title text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_booking
  from public.bookings b
  where b.id = p_booking_id
  for update;

  if v_booking.id is null or v_booking.customer_id <> v_user_id then
    raise exception 'Booking not found';
  end if;

  if v_booking.status = 'payment_failed' then
    if v_booking.payment_retry_count >= 1 then
      raise exception 'Payment retry limit reached';
    end if;

    select * into v_settings from public.get_platform_settings();

    update public.bookings
    set
      status = 'pending_payment',
      payment_retry_count = payment_retry_count + 1,
      hold_expires_at = timezone('utc', now()) + make_interval(mins => v_settings.hold_ttl_minutes)
    where id = p_booking_id
    returning * into v_booking;
  elsif v_booking.status <> 'pending_payment' then
    raise exception 'Booking is not awaiting payment';
  end if;

  if v_booking.hold_expires_at is not null
    and v_booking.hold_expires_at <= timezone('utc', now()) then
    update public.bookings
    set status = 'expired'
    where id = p_booking_id
      and status = 'pending_payment';

    raise exception 'Booking hold has expired';
  end if;

  select * into v_snapshot
  from public.booking_price_snapshots s
  where s.booking_id = p_booking_id;

  if v_snapshot.booking_id is null then
    raise exception 'Booking price snapshot missing';
  end if;

  select p.title into v_property_title
  from public.properties p
  where p.id = v_booking.property_id;

  insert into public.payments (
    order_id,
    booking_id,
    customer_id,
    amount_krw,
    status
  )
  values (
    v_order_id,
    p_booking_id,
    v_user_id,
    v_snapshot.total_krw,
    'pending'
  )
  returning * into v_payment;

  return query
  select
    v_payment.id,
    v_payment.order_id,
    v_payment.booking_id,
    v_payment.amount_krw,
    coalesce(v_property_title, 'Housing Platform stay');
end;
$$;

create or replace function public.finalize_successful_payment(
  p_order_id uuid,
  p_payment_key text,
  p_amount_krw integer,
  p_toss_response jsonb default null
)
returns public.payments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
  v_booking public.bookings;
begin
  select * into v_payment
  from public.payments p
  where p.order_id = p_order_id
  for update;

  if v_payment.id is null then
    raise exception 'Payment not found';
  end if;

  if v_payment.status = 'confirmed' then
    return v_payment;
  end if;

  if v_payment.amount_krw <> p_amount_krw then
    raise exception 'Payment amount mismatch';
  end if;

  select * into v_booking
  from public.bookings b
  where b.id = v_payment.booking_id
  for update;

  if v_booking.status = 'confirmed' then
    update public.payments
    set
      status = 'confirmed',
      payment_key = p_payment_key,
      toss_response = coalesce(p_toss_response, toss_response),
      confirmed_at = coalesce(confirmed_at, timezone('utc', now()))
    where id = v_payment.id
    returning * into v_payment;

    return v_payment;
  end if;

  if v_booking.status <> 'pending_payment' then
    raise exception 'Booking is not awaiting payment';
  end if;

  if v_booking.hold_expires_at is not null
    and v_booking.hold_expires_at <= timezone('utc', now()) then
    update public.bookings
    set status = 'expired'
    where id = v_booking.id;

    raise exception 'Booking hold has expired';
  end if;

  update public.payments
  set
    status = 'confirmed',
    payment_key = p_payment_key,
    toss_response = p_toss_response,
    confirmed_at = timezone('utc', now())
  where id = v_payment.id
  returning * into v_payment;

  update public.bookings
  set status = 'confirmed'
  where id = v_booking.id;

  return v_payment;
end;
$$;

create or replace function public.mark_payment_failed(
  p_order_id uuid,
  p_reason text default null,
  p_toss_response jsonb default null
)
returns public.payments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
begin
  select * into v_payment
  from public.payments p
  where p.order_id = p_order_id
  for update;

  if v_payment.id is null then
    raise exception 'Payment not found';
  end if;

  if v_payment.status = 'confirmed' then
    return v_payment;
  end if;

  update public.payments
  set
    status = 'failed',
    failed_reason = nullif(trim(p_reason), ''),
    toss_response = coalesce(p_toss_response, toss_response)
  where id = v_payment.id
  returning * into v_payment;

  update public.bookings
  set status = 'payment_failed'
  where id = v_payment.booking_id
    and status in ('pending_payment', 'payment_failed');

  return v_payment;
end;
$$;

create or replace function public.record_payment_event(
  p_event_id text,
  p_payment_id uuid,
  p_booking_id uuid,
  p_event_type text,
  p_payload jsonb
)
returns public.payment_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.payment_events;
begin
  insert into public.payment_events (
    event_id,
    payment_id,
    booking_id,
    event_type,
    payload
  )
  values (
    p_event_id,
    p_payment_id,
    p_booking_id,
    p_event_type,
    p_payload
  )
  on conflict (event_id) do nothing
  returning * into v_event;

  if v_event.id is null then
    select * into v_event
    from public.payment_events pe
    where pe.event_id = p_event_id;
  end if;

  return v_event;
end;
$$;

alter table public.payments enable row level security;
alter table public.payment_events enable row level security;

create policy "Customers can view their own payments"
on public.payments
for select
to authenticated
using (customer_id = (select auth.uid()));

create policy "Hosts can view payments on their properties"
on public.payments
for select
to authenticated
using (
  exists (
    select 1
    from public.bookings b
    where b.id = booking_id
      and public.is_host_of_property(b.property_id)
  )
);

create policy "Admins can manage all payments"
on public.payments
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can view payment events"
on public.payment_events
for select
to authenticated
using (public.is_admin());

grant select on public.payments to authenticated;
grant select on public.payment_events to authenticated;
grant all on public.payments to service_role;
grant all on public.payment_events to service_role;

grant execute on function public.create_payment_order(uuid) to authenticated;
grant execute on function public.finalize_successful_payment(uuid, text, integer, jsonb) to service_role;
grant execute on function public.mark_payment_failed(uuid, text, jsonb) to service_role;
grant execute on function public.record_payment_event(text, uuid, uuid, text, jsonb) to service_role;
