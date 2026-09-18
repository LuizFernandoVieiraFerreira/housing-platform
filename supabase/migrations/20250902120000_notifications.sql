-- In-app notifications — table, RLS, booking hooks

create type public.notification_type as enum (
  'booking_request',
  'booking_confirmed',
  'booking_rejected'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint notifications_title_not_blank check (char_length(trim(title)) > 0),
  constraint notifications_body_not_blank check (char_length(trim(body)) > 0)
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);

create index notifications_user_unread_idx on public.notifications (user_id)
where
  read_at is null;

alter publication supabase_realtime add table public.notifications;

create or replace function public.create_notification(
  p_user_id uuid,
  p_type public.notification_type,
  p_title text,
  p_body text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    raise exception 'Notification recipient is required';
  end if;

  insert into public.notifications (user_id, type, title, body, metadata)
  values (
    p_user_id,
    p_type,
    trim(p_title),
    trim(p_body),
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

create or replace function public.try_create_notification(
  p_user_id uuid,
  p_type public.notification_type,
  p_title text,
  p_body text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.create_notification(
    p_user_id,
    p_type,
    p_title,
    p_body,
    p_metadata
  );
exception
  when others then
    raise warning 'notification insert failed: %', sqlerrm;
end;
$$;

create or replace function public.notify_booking_request(p_booking public.bookings)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host_user_id uuid;
  v_property_title text;
  v_guest_name text;
begin
  select h.profile_id, p.title
  into v_host_user_id, v_property_title
  from public.properties p
  join public.hosts h on h.id = p.host_id
  where p.id = p_booking.property_id;

  if v_host_user_id is null then
    return;
  end if;

  select coalesce(nullif(trim(full_name), ''), 'A guest')
  into v_guest_name
  from public.profiles
  where id = p_booking.customer_id;

  perform public.try_create_notification(
    v_host_user_id,
    'booking_request',
    'New booking request',
    format(
      '%s requested to book %s, %s – %s',
      v_guest_name,
      v_property_title,
      to_char(p_booking.check_in, 'Mon DD, YYYY'),
      to_char(p_booking.check_out, 'Mon DD, YYYY')
    ),
    jsonb_build_object(
      'booking_id', p_booking.id,
      'property_id', p_booking.property_id,
      'property_title', v_property_title,
      'guest_name', v_guest_name,
      'check_in', p_booking.check_in,
      'check_out', p_booking.check_out
    )
  );
end;
$$;

create or replace function public.notify_booking_confirmed(p_booking public.bookings)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_property_title text;
  v_host_name text;
begin
  select p.title, coalesce(nullif(trim(h.display_name), ''), 'Your host')
  into v_property_title, v_host_name
  from public.properties p
  join public.hosts h on h.id = p.host_id
  where p.id = p_booking.property_id;

  perform public.try_create_notification(
    p_booking.customer_id,
    'booking_confirmed',
    'Booking confirmed',
    format(
      '%s confirmed your booking for %s, %s – %s',
      v_host_name,
      v_property_title,
      to_char(p_booking.check_in, 'Mon DD, YYYY'),
      to_char(p_booking.check_out, 'Mon DD, YYYY')
    ),
    jsonb_build_object(
      'booking_id', p_booking.id,
      'property_id', p_booking.property_id,
      'property_title', v_property_title,
      'host_name', v_host_name,
      'check_in', p_booking.check_in,
      'check_out', p_booking.check_out
    )
  );
end;
$$;

create or replace function public.notify_booking_rejected(p_booking public.bookings)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_property_title text;
  v_host_name text;
begin
  select p.title, coalesce(nullif(trim(h.display_name), ''), 'Your host')
  into v_property_title, v_host_name
  from public.properties p
  join public.hosts h on h.id = p.host_id
  where p.id = p_booking.property_id;

  perform public.try_create_notification(
    p_booking.customer_id,
    'booking_rejected',
    'Booking request declined',
    format(
      '%s declined your booking request for %s, %s – %s',
      v_host_name,
      v_property_title,
      to_char(p_booking.check_in, 'Mon DD, YYYY'),
      to_char(p_booking.check_out, 'Mon DD, YYYY')
    ),
    jsonb_build_object(
      'booking_id', p_booking.id,
      'property_id', p_booking.property_id,
      'property_title', v_property_title,
      'host_name', v_host_name,
      'check_in', p_booking.check_in,
      'check_out', p_booking.check_out
    )
  );
end;
$$;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns public.notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notification public.notifications;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.notifications
  set read_at = timezone('utc', now())
  where id = p_notification_id
    and user_id = auth.uid()
    and read_at is null
  returning * into v_notification;

  if v_notification.id is null then
    select * into v_notification
    from public.notifications
    where id = p_notification_id
      and user_id = auth.uid();
  end if;

  if v_notification.id is null then
    raise exception 'Notification not found';
  end if;

  return v_notification;
end;
$$;

create or replace function public.mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.notifications
  set read_at = timezone('utc', now())
  where user_id = auth.uid()
    and read_at is null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.get_unread_notification_count()
returns integer
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select count(*)::integer
  into v_count
  from public.notifications
  where user_id = auth.uid()
    and read_at is null;

  return coalesce(v_count, 0);
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

  perform public.notify_booking_request(v_booking);

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

  perform public.notify_booking_confirmed(v_booking);

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

  perform public.notify_booking_rejected(v_booking);

  return v_booking;
end;
$$;

alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
on public.notifications
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can mark their own notifications as read"
on public.notifications
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
grant execute on function public.mark_notification_read(uuid) to authenticated;
grant execute on function public.mark_all_notifications_read() to authenticated;
grant execute on function public.get_unread_notification_count() to authenticated;
