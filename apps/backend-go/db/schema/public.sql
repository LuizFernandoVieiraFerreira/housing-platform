

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'Housing Platform application schema';



CREATE TYPE "public"."accommodation_type" AS ENUM (
    'share-house',
    'studio',
    'micro-studio',
    'multi-bedroom'
);


ALTER TYPE "public"."accommodation_type" OWNER TO "postgres";


CREATE TYPE "public"."booking_mode" AS ENUM (
    'instant',
    'request'
);


ALTER TYPE "public"."booking_mode" OWNER TO "postgres";


CREATE TYPE "public"."booking_status" AS ENUM (
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


ALTER TYPE "public"."booking_status" OWNER TO "postgres";


CREATE TYPE "public"."booking_type" AS ENUM (
    'instant',
    'request'
);


ALTER TYPE "public"."booking_type" OWNER TO "postgres";


CREATE TYPE "public"."host_status" AS ENUM (
    'pending',
    'active',
    'suspended'
);


ALTER TYPE "public"."host_status" OWNER TO "postgres";


CREATE TYPE "public"."housing_request_status" AS ENUM (
    'new',
    'in_progress',
    'closed'
);


ALTER TYPE "public"."housing_request_status" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'booking_request',
    'booking_confirmed',
    'booking_rejected'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'confirmed',
    'failed',
    'cancelled'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."property_embedding_sync_status" AS ENUM (
    'pending',
    'synced',
    'failed',
    'not_applicable'
);


ALTER TYPE "public"."property_embedding_sync_status" OWNER TO "postgres";


CREATE TYPE "public"."property_status" AS ENUM (
    'draft',
    'pending_review',
    'published',
    'archived'
);


ALTER TYPE "public"."property_status" OWNER TO "postgres";


CREATE TYPE "public"."room_status" AS ENUM (
    'available',
    'unavailable',
    'archived'
);


ALTER TYPE "public"."room_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'customer',
    'host',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."properties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "host_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text" NOT NULL,
    "property_type" "public"."accommodation_type" NOT NULL,
    "address_line1" "text" NOT NULL,
    "address_line2" "text",
    "city" "text" DEFAULT 'Seoul'::"text" NOT NULL,
    "postal_code" "text",
    "country" "text" DEFAULT 'KR'::"text" NOT NULL,
    "location" "extensions"."geography"(Point,4326),
    "district" "text" NOT NULL,
    "nearest_station_name" "text",
    "nearest_station_walk_min" integer,
    "status" "public"."property_status" DEFAULT 'draft'::"public"."property_status" NOT NULL,
    "booking_mode" "public"."booking_mode" DEFAULT 'request'::"public"."booking_mode" NOT NULL,
    "min_stay_nights" integer DEFAULT 30 NOT NULL,
    "monthly_price_min" integer,
    "is_featured" boolean DEFAULT false NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "published_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "embedding_sync_status" "public"."property_embedding_sync_status",
    "embedding_sync_requested_at" timestamp with time zone,
    "embedding_synced_at" timestamp with time zone,
    "embedding_sync_error" "text",
    "embedding_sync_attempts" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "properties_description_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "description")) > 0)),
    CONSTRAINT "properties_district_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "district")) > 0)),
    CONSTRAINT "properties_min_stay_nights_positive" CHECK (("min_stay_nights" > 0)),
    CONSTRAINT "properties_monthly_price_min_positive" CHECK ((("monthly_price_min" IS NULL) OR ("monthly_price_min" > 0))),
    CONSTRAINT "properties_nearest_station_walk_min_positive" CHECK ((("nearest_station_walk_min" IS NULL) OR ("nearest_station_walk_min" > 0))),
    CONSTRAINT "properties_slug_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "slug")) > 0)),
    CONSTRAINT "properties_title_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "title")) > 0))
);


ALTER TABLE "public"."properties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "room_id" "uuid" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "check_in" "date" NOT NULL,
    "check_out" "date" NOT NULL,
    "guest_count" integer NOT NULL,
    "status" "public"."booking_status" NOT NULL,
    "booking_type" "public"."booking_type" NOT NULL,
    "hold_expires_at" timestamp with time zone,
    "customer_notes" "text",
    "approved_at" timestamp with time zone,
    "approved_by" "uuid",
    "cancelled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "payment_retry_count" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "bookings_check_out_after_check_in" CHECK (("check_out" > "check_in")),
    CONSTRAINT "bookings_guest_count_positive" CHECK (("guest_count" > 0)),
    CONSTRAINT "bookings_hold_expires_when_pending" CHECK ((("status" <> 'pending_payment'::"public"."booking_status") OR ("hold_expires_at" IS NOT NULL))),
    CONSTRAINT "bookings_payment_retry_count_non_negative" CHECK (("payment_retry_count" >= 0))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_booking_request"("p_booking_id" "uuid") RETURNS "public"."bookings"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."approve_booking_request"("p_booking_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hosts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "display_name" "text" NOT NULL,
    "status" "public"."host_status" DEFAULT 'pending'::"public"."host_status" NOT NULL,
    "verified_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "hosts_display_name_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "display_name")) > 0))
);


ALTER TABLE "public"."hosts" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_host"("p_host_id" "uuid") RETURNS "public"."hosts"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  updated_host public.hosts;
begin
  if not public.is_admin() then
    raise exception 'Only admins can approve hosts';
  end if;

  update public.hosts
  set
    status = 'active',
    verified_at = timezone('utc', now())
  where id = p_host_id
    and deleted_at is null
    and status = 'pending'
  returning * into updated_host;

  if updated_host.id is null then
    raise exception 'Host must be pending before it can be approved';
  end if;

  perform public.write_audit_log(
    'host.approved',
    'host',
    updated_host.id,
    jsonb_build_object('display_name', updated_host.display_name)
  );

  return updated_host;
end;
$$;


ALTER FUNCTION "public"."approve_host"("p_host_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assert_rate_limit"("p_bucket" "text", "p_max_requests" integer DEFAULT 30, "p_window_seconds" integer DEFAULT 60) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."assert_rate_limit"("p_bucket" "text", "p_max_requests" integer, "p_window_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."build_property_search_document"("p_property_id" "uuid") RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."build_property_search_document"("p_property_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_booking_price"("p_monthly_price_krw" integer, "p_nights" integer, "p_service_fee_bps" integer DEFAULT 1000) RETURNS TABLE("rent_krw" integer, "service_fee_krw" integer, "total_krw" integer, "pricing_version" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."calculate_booking_price"("p_monthly_price_krw" integer, "p_nights" integer, "p_service_fee_bps" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_own_booking"("p_booking_id" "uuid") RETURNS "public"."bookings"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."cancel_own_booking"("p_booking_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_booking_hold"("p_room_id" "uuid", "p_check_in" "date", "p_check_out" "date", "p_guest_count" integer, "p_customer_notes" "text" DEFAULT NULL::"text") RETURNS "public"."bookings"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."create_booking_hold"("p_room_id" "uuid", "p_check_in" "date", "p_check_out" "date", "p_guest_count" integer, "p_customer_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_body" "text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_body" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_payment_order"("p_booking_id" "uuid") RETURNS TABLE("payment_id" "uuid", "order_id" "uuid", "booking_id" "uuid", "amount_krw" integer, "order_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."create_payment_order"("p_booking_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_host_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select h.id
  from public.hosts h
  where h.profile_id = (select auth.uid())
    and h.deleted_at is null
  limit 1;
$$;


ALTER FUNCTION "public"."current_host_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_booking_holds"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."expire_booking_holds"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "payment_key" "text",
    "booking_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "amount_krw" integer NOT NULL,
    "status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status" NOT NULL,
    "toss_response" "jsonb",
    "failed_reason" "text",
    "confirmed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "payments_amount_positive" CHECK (("amount_krw" > 0))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."finalize_successful_payment"("p_order_id" "uuid", "p_payment_key" "text", "p_amount_krw" integer, "p_toss_response" "jsonb" DEFAULT NULL::"jsonb") RETURNS "public"."payments"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."finalize_successful_payment"("p_order_id" "uuid", "p_payment_key" "text", "p_amount_krw" integer, "p_toss_response" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_host_property_coordinates"("p_property_id" "uuid") RETURNS TABLE("latitude" double precision, "longitude" double precision)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
  select
    extensions.st_y(p.location::extensions.geometry) as latitude,
    extensions.st_x(p.location::extensions.geometry) as longitude
  from public.properties p
  where p.id = p_property_id
    and p.deleted_at is null
    and public.is_host_of_property(p.id)
    and p.location is not null;
$$;


ALTER FUNCTION "public"."get_host_property_coordinates"("p_property_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."platform_settings" (
    "id" smallint NOT NULL,
    "service_fee_bps" integer DEFAULT 1000 NOT NULL,
    "hold_ttl_minutes" integer DEFAULT 15 NOT NULL,
    "pricing_version" "text" DEFAULT 'v1'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "platform_settings_hold_ttl_positive" CHECK (("hold_ttl_minutes" > 0)),
    CONSTRAINT "platform_settings_pricing_version_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "pricing_version")) > 0)),
    CONSTRAINT "platform_settings_service_fee_bps_valid" CHECK ((("service_fee_bps" >= 0) AND ("service_fee_bps" <= 10000)))
);


ALTER TABLE "public"."platform_settings" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_platform_settings"() RETURNS "public"."platform_settings"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select *
  from public.platform_settings
  where id = 1;
$$;


ALTER FUNCTION "public"."get_platform_settings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_property_coordinates"("p_property_id" "uuid") RETURNS TABLE("latitude" double precision, "longitude" double precision)
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
  select
    extensions.st_y(p.location::extensions.geometry) as latitude,
    extensions.st_x(p.location::extensions.geometry) as longitude
  from public.properties p
  where p.id = p_property_id
    and p.deleted_at is null
    and p.status = 'published'
    and p.location is not null;
$$;


ALTER FUNCTION "public"."get_property_coordinates"("p_property_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_notification_count"() RETURNS integer
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."get_unread_notification_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, full_name, marketing_consent)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'New user'),
    coalesce((new.raw_user_meta_data ->> 'marketing_consent')::boolean, false)
  );

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and deleted_at is null
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_host_of_booking"("p_booking_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.bookings b
    where b.id = p_booking_id
      and public.is_host_of_property(b.property_id)
  );
$$;


ALTER FUNCTION "public"."is_host_of_booking"("p_booking_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_host_of_property"("p_property_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."is_host_of_property"("p_property_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_all_notifications_read"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."mark_all_notifications_read"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."notification_type" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "notifications_body_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "body")) > 0)),
    CONSTRAINT "notifications_title_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "title")) > 0))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") RETURNS "public"."notifications"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_payment_failed"("p_order_id" "uuid", "p_reason" "text" DEFAULT NULL::"text", "p_toss_response" "jsonb" DEFAULT NULL::"jsonb") RETURNS "public"."payments"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."mark_payment_failed"("p_order_id" "uuid", "p_reason" "text", "p_toss_response" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_booking_confirmed"("p_booking" "public"."bookings") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."notify_booking_confirmed"("p_booking" "public"."bookings") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_booking_rejected"("p_booking" "public"."bookings") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."notify_booking_rejected"("p_booking" "public"."bookings") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_booking_request"("p_booking" "public"."bookings") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."notify_booking_request"("p_booking" "public"."bookings") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."protect_profile_role"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if old.role is distinct from new.role and not public.is_admin() then
    new.role := old.role;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."protect_profile_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."publish_property"("p_property_id" "uuid") RETURNS "public"."properties"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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

  perform public.write_audit_log(
    'property.published',
    'property',
    updated_property.id,
    jsonb_build_object('title', updated_property.title, 'slug', updated_property.slug)
  );

  return updated_property;
end;
$$;


ALTER FUNCTION "public"."publish_property"("p_property_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."quote_booking"("p_room_id" "uuid", "p_check_in" "date", "p_check_out" "date", "p_guest_count" integer) RETURNS TABLE("room_id" "uuid", "property_id" "uuid", "booking_mode" "public"."booking_mode", "nights" integer, "rent_krw" integer, "service_fee_krw" integer, "total_krw" integer, "pricing_version" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."quote_booking"("p_room_id" "uuid", "p_check_in" "date", "p_check_out" "date", "p_guest_count" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "text" NOT NULL,
    "payment_id" "uuid",
    "booking_id" "uuid",
    "event_type" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "processed_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."payment_events" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_payment_event"("p_event_id" "text", "p_payment_id" "uuid", "p_booking_id" "uuid", "p_event_type" "text", "p_payload" "jsonb") RETURNS "public"."payment_events"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."record_payment_event"("p_event_id" "text", "p_payment_id" "uuid", "p_booking_id" "uuid", "p_event_type" "text", "p_payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_as_host"("p_display_name" "text") RETURNS "public"."hosts"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."register_as_host"("p_display_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_booking_request"("p_booking_id" "uuid") RETURNS "public"."bookings"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."reject_booking_request"("p_booking_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_property_review"("p_property_id" "uuid") RETURNS "public"."properties"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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

  perform public.write_audit_log(
    'property.review_rejected',
    'property',
    updated_property.id,
    jsonb_build_object('title', updated_property.title, 'slug', updated_property.slug)
  );

  return updated_property;
end;
$$;


ALTER FUNCTION "public"."reject_property_review"("p_property_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."retry_pending_property_embedding_syncs"("p_limit" integer DEFAULT 20) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'private', 'pg_catalog'
    AS $$
declare
  property_row record;
  processed integer := 0;
begin
  if p_limit < 1 then
    raise exception 'p_limit must be at least 1';
  end if;

  for property_row in
    select p.id
    from public.properties p
    left join public.property_search_embeddings pse on pse.property_id = p.id
    where p.status = 'published'::public.property_status
      and p.deleted_at is null
      and p.embedding_sync_attempts < 10
      and (
        p.embedding_sync_status in ('pending', 'failed')
        or (
          p.embedding_sync_status = 'synced'::public.property_embedding_sync_status
          and pse.property_id is null
        )
      )
      and (
        p.embedding_sync_requested_at is null
        or p.embedding_sync_requested_at <= timezone('utc', now()) - interval '1 minute'
      )
    order by p.embedding_sync_requested_at nulls first, p.updated_at desc
    limit p_limit
  loop
    update public.properties
    set
      embedding_sync_status = 'pending',
      embedding_sync_requested_at = timezone('utc', now()),
      embedding_sync_attempts = embedding_sync_attempts + 1
    where id = property_row.id;

    perform private.invoke_property_embedding_sync(property_row.id);
    processed := processed + 1;
  end loop;

  return processed;
end;
$$;


ALTER FUNCTION "public"."retry_pending_property_embedding_syncs"("p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."retry_pending_property_embedding_syncs"("p_limit" integer) IS 'Invokes sync-property-embedding for pending/failed published listings. Used by pg_cron and ops backfills.';



CREATE OR REPLACE FUNCTION "public"."room_has_booking_conflict"("p_room_id" "uuid", "p_check_in" "date", "p_check_out" "date") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.bookings b
    where b.room_id = p_room_id
      and b.status in ('pending_payment', 'confirmed', 'active')
      and daterange(b.check_in, b.check_out, '[)') && daterange(p_check_in, p_check_out, '[)')
  );
$$;


ALTER FUNCTION "public"."room_has_booking_conflict"("p_room_id" "uuid", "p_check_in" "date", "p_check_out" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_properties"("p_filters" "jsonb" DEFAULT '{}'::"jsonb", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "title" "text", "slug" "text", "property_type" "public"."accommodation_type", "district" "text", "nearest_station_name" "text", "monthly_price_min" integer, "tags" "text"[], "cover_storage_path" "text", "cover_alt_text" "text", "latitude" double precision, "longitude" double precision, "distance_meters" double precision, "total_count" bigint)
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
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


ALTER FUNCTION "public"."search_properties"("p_filters" "jsonb", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_properties_hybrid"("p_filters" "jsonb" DEFAULT '{}'::"jsonb", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0, "p_query_embedding" "extensions"."vector" DEFAULT NULL::"extensions"."vector", "p_reference_embedding" "extensions"."vector" DEFAULT NULL::"extensions"."vector", "p_match_threshold" double precision DEFAULT 0.55) RETURNS TABLE("id" "uuid", "title" "text", "slug" "text", "property_type" "public"."accommodation_type", "district" "text", "nearest_station_name" "text", "monthly_price_min" integer, "tags" "text"[], "cover_storage_path" "text", "cover_alt_text" "text", "latitude" double precision, "longitude" double precision, "distance_meters" double precision, "total_count" bigint)
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
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


ALTER FUNCTION "public"."search_properties_hybrid"("p_filters" "jsonb", "p_limit" integer, "p_offset" integer, "p_query_embedding" "extensions"."vector", "p_reference_embedding" "extensions"."vector", "p_match_threshold" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_property_location"("p_property_id" "uuid", "p_latitude" double precision, "p_longitude" double precision) RETURNS "public"."properties"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."set_property_location"("p_property_id" "uuid", "p_latitude" double precision, "p_longitude" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_property_for_review"("p_property_id" "uuid") RETURNS "public"."properties"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."submit_property_for_review"("p_property_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_property_monthly_price_min"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."sync_property_monthly_price_min"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."try_create_notification"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_body" "text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."try_create_notification"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_body" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."housing_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "email" "text" NOT NULL,
    "desired_area" "text" NOT NULL,
    "check_in" "date",
    "check_out" "date",
    "budget_max" integer,
    "accommodation_type" "public"."accommodation_type",
    "notes" "text",
    "status" "public"."housing_request_status" DEFAULT 'new'::"public"."housing_request_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "housing_requests_budget_positive" CHECK ((("budget_max" IS NULL) OR ("budget_max" > 0))),
    CONSTRAINT "housing_requests_desired_area_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "desired_area")) > 0)),
    CONSTRAINT "housing_requests_email_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "email")) > 0))
);


ALTER TABLE "public"."housing_requests" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_housing_request_status"("p_request_id" "uuid", "p_status" "public"."housing_request_status") RETURNS "public"."housing_requests"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  updated_request public.housing_requests;
begin
  if not public.is_admin() then
    raise exception 'Only admins can update housing requests';
  end if;

  update public.housing_requests
  set status = p_status
  where id = p_request_id
  returning * into updated_request;

  if updated_request.id is null then
    raise exception 'Housing request not found';
  end if;

  perform public.write_audit_log(
    'housing_request.status_updated',
    'housing_request',
    updated_request.id,
    jsonb_build_object('status', updated_request.status::text)
  );

  return updated_request;
end;
$$;


ALTER FUNCTION "public"."update_housing_request_status"("p_request_id" "uuid", "p_status" "public"."housing_request_status") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_booking_inputs"("p_room_id" "uuid", "p_check_in" "date", "p_check_out" "date", "p_guest_count" integer) RETURNS TABLE("room_id" "uuid", "property_id" "uuid", "booking_mode" "public"."booking_mode", "min_stay_nights" integer, "monthly_price_krw" integer, "max_occupancy" integer, "nights" integer)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."validate_booking_inputs"("p_room_id" "uuid", "p_check_in" "date", "p_check_out" "date", "p_guest_count" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "audit_logs_action_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "action")) > 0)),
    CONSTRAINT "audit_logs_entity_type_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "entity_type")) > 0))
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."write_audit_log"("p_action" "text", "p_entity_type" "text", "p_entity_id" "uuid" DEFAULT NULL::"uuid", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."audit_logs"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_actor_id uuid := auth.uid();
  v_log public.audit_logs;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    v_actor_id,
    trim(p_action),
    trim(p_entity_type),
    p_entity_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_log;

  return v_log;
end;
$$;


ALTER FUNCTION "public"."write_audit_log"("p_action" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."amenities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "icon" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "amenities_name_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "name")) > 0)),
    CONSTRAINT "amenities_slug_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "slug")) > 0))
);


ALTER TABLE "public"."amenities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_rate_limits" (
    "bucket" "text" NOT NULL,
    "window_start" timestamp with time zone NOT NULL,
    "request_count" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "api_rate_limits_request_count_non_negative" CHECK (("request_count" >= 0))
);


ALTER TABLE "public"."api_rate_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_price_snapshots" (
    "booking_id" "uuid" NOT NULL,
    "rent_krw" integer NOT NULL,
    "service_fee_krw" integer NOT NULL,
    "utilities_krw" integer DEFAULT 0 NOT NULL,
    "total_krw" integer NOT NULL,
    "pricing_version" "text" NOT NULL,
    "nightly_breakdown" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "booking_price_snapshots_rent_positive" CHECK (("rent_krw" > 0)),
    CONSTRAINT "booking_price_snapshots_service_fee_non_negative" CHECK (("service_fee_krw" >= 0)),
    CONSTRAINT "booking_price_snapshots_total_positive" CHECK (("total_krw" > 0))
);


ALTER TABLE "public"."booking_price_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."location_aliases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "alias" "text" NOT NULL,
    "district" "text" NOT NULL,
    "center_lat" double precision NOT NULL,
    "center_lng" double precision NOT NULL,
    "radius_meters" integer DEFAULT 2500 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "location_aliases_alias_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "alias")) > 0)),
    CONSTRAINT "location_aliases_center_lat_range" CHECK ((("center_lat" >= ('-90'::integer)::double precision) AND ("center_lat" <= (90)::double precision))),
    CONSTRAINT "location_aliases_center_lng_range" CHECK ((("center_lng" >= ('-180'::integer)::double precision) AND ("center_lng" <= (180)::double precision))),
    CONSTRAINT "location_aliases_district_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "district")) > 0)),
    CONSTRAINT "location_aliases_radius_positive" CHECK (("radius_meters" > 0))
);


ALTER TABLE "public"."location_aliases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "role" "public"."user_role" DEFAULT 'customer'::"public"."user_role" NOT NULL,
    "full_name" "text" NOT NULL,
    "phone" "text",
    "avatar_url" "text",
    "preferred_language" "text" DEFAULT 'en'::"text" NOT NULL,
    "marketing_consent" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "profiles_full_name_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "full_name")) > 0)),
    CONSTRAINT "profiles_preferred_language_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "preferred_language")) > 0))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_amenities" (
    "property_id" "uuid" NOT NULL,
    "amenity_id" "uuid" NOT NULL
);


ALTER TABLE "public"."property_amenities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "alt_text" "text",
    "is_cover" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "property_images_storage_path_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "storage_path")) > 0))
);


ALTER TABLE "public"."property_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_search_embeddings" (
    "property_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "content_hash" "text" NOT NULL,
    "embedding" "extensions"."vector"(1536) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "property_search_embeddings_content_hash_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "content_hash")) > 0)),
    CONSTRAINT "property_search_embeddings_content_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "content")) > 0))
);


ALTER TABLE "public"."property_search_embeddings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."room_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "alt_text" "text",
    "is_cover" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "room_images_storage_path_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "storage_path")) > 0))
);


ALTER TABLE "public"."room_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "room_type" "text",
    "size_sqm" numeric(8,2),
    "max_occupancy" integer DEFAULT 1 NOT NULL,
    "monthly_price_krw" integer NOT NULL,
    "status" "public"."room_status" DEFAULT 'available'::"public"."room_status" NOT NULL,
    "available_from" "date",
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "rooms_max_occupancy_positive" CHECK (("max_occupancy" > 0)),
    CONSTRAINT "rooms_monthly_price_positive" CHECK (("monthly_price_krw" > 0)),
    CONSTRAINT "rooms_name_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "name")) > 0)),
    CONSTRAINT "rooms_size_sqm_positive" CHECK ((("size_sqm" IS NULL) OR ("size_sqm" > (0)::numeric)))
);


ALTER TABLE "public"."rooms" OWNER TO "postgres";


ALTER TABLE ONLY "public"."amenities"
    ADD CONSTRAINT "amenities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."amenities"
    ADD CONSTRAINT "amenities_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."api_rate_limits"
    ADD CONSTRAINT "api_rate_limits_pkey" PRIMARY KEY ("bucket", "window_start");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_price_snapshots"
    ADD CONSTRAINT "booking_price_snapshots_pkey" PRIMARY KEY ("booking_id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_no_overlap" EXCLUDE USING "gist" ("room_id" WITH =, "daterange"("check_in", "check_out", '[)'::"text") WITH &&) WHERE (("status" = ANY (ARRAY['pending_payment'::"public"."booking_status", 'confirmed'::"public"."booking_status", 'active'::"public"."booking_status"])));



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hosts"
    ADD CONSTRAINT "hosts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hosts"
    ADD CONSTRAINT "hosts_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."housing_requests"
    ADD CONSTRAINT "housing_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."location_aliases"
    ADD CONSTRAINT "location_aliases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_events"
    ADD CONSTRAINT "payment_events_event_id_unique" UNIQUE ("event_id");



ALTER TABLE ONLY "public"."payment_events"
    ADD CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_order_id_unique" UNIQUE ("order_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_settings"
    ADD CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_amenities"
    ADD CONSTRAINT "property_amenities_pkey" PRIMARY KEY ("property_id", "amenity_id");



ALTER TABLE ONLY "public"."property_images"
    ADD CONSTRAINT "property_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_search_embeddings"
    ADD CONSTRAINT "property_search_embeddings_pkey" PRIMARY KEY ("property_id");



ALTER TABLE ONLY "public"."room_images"
    ADD CONSTRAINT "room_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_pkey" PRIMARY KEY ("id");



CREATE INDEX "api_rate_limits_window_start_idx" ON "public"."api_rate_limits" USING "btree" ("window_start");



CREATE INDEX "audit_logs_created_at_idx" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "audit_logs_entity_idx" ON "public"."audit_logs" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "bookings_customer_status_idx" ON "public"."bookings" USING "btree" ("customer_id", "status");



CREATE INDEX "bookings_room_dates_idx" ON "public"."bookings" USING "btree" ("room_id", "check_in", "check_out");



CREATE INDEX "bookings_status_hold_expires_idx" ON "public"."bookings" USING "btree" ("status", "hold_expires_at") WHERE ("status" = 'pending_payment'::"public"."booking_status");



CREATE INDEX "hosts_status_idx" ON "public"."hosts" USING "btree" ("status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "housing_requests_customer_id_idx" ON "public"."housing_requests" USING "btree" ("customer_id");



CREATE INDEX "housing_requests_status_idx" ON "public"."housing_requests" USING "btree" ("status", "created_at" DESC);



CREATE UNIQUE INDEX "location_aliases_alias_unique_idx" ON "public"."location_aliases" USING "btree" ("lower"(TRIM(BOTH FROM "alias")));



CREATE INDEX "location_aliases_district_idx" ON "public"."location_aliases" USING "btree" ("district");



CREATE INDEX "notifications_user_created_idx" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "notifications_user_unread_idx" ON "public"."notifications" USING "btree" ("user_id") WHERE ("read_at" IS NULL);



CREATE INDEX "payments_booking_id_idx" ON "public"."payments" USING "btree" ("booking_id");



CREATE INDEX "payments_customer_id_idx" ON "public"."payments" USING "btree" ("customer_id");



CREATE UNIQUE INDEX "payments_payment_key_unique_idx" ON "public"."payments" USING "btree" ("payment_key") WHERE ("payment_key" IS NOT NULL);



CREATE INDEX "profiles_role_idx" ON "public"."profiles" USING "btree" ("role") WHERE ("deleted_at" IS NULL);



CREATE INDEX "properties_embedding_sync_status_idx" ON "public"."properties" USING "btree" ("embedding_sync_status", "embedding_sync_requested_at") WHERE (("status" = 'published'::"public"."property_status") AND ("deleted_at" IS NULL));



CREATE INDEX "properties_featured_idx" ON "public"."properties" USING "btree" ("is_featured", "published_at" DESC) WHERE (("deleted_at" IS NULL) AND ("status" = 'published'::"public"."property_status"));



CREATE INDEX "properties_location_idx" ON "public"."properties" USING "gist" ("location") WHERE (("deleted_at" IS NULL) AND ("status" = 'published'::"public"."property_status"));



CREATE INDEX "properties_search_idx" ON "public"."properties" USING "gin" ("to_tsvector"('"simple"'::"regconfig", ((((COALESCE("title", ''::"text") || ' '::"text") || COALESCE("description", ''::"text")) || ' '::"text") || COALESCE("district", ''::"text")))) WHERE (("deleted_at" IS NULL) AND ("status" = 'published'::"public"."property_status"));



CREATE UNIQUE INDEX "properties_slug_unique_idx" ON "public"."properties" USING "btree" ("slug") WHERE ("deleted_at" IS NULL);



CREATE INDEX "properties_status_type_price_idx" ON "public"."properties" USING "btree" ("status", "property_type", "monthly_price_min") WHERE ("deleted_at" IS NULL);



CREATE UNIQUE INDEX "property_images_one_cover_idx" ON "public"."property_images" USING "btree" ("property_id") WHERE ("is_cover" = true);



CREATE INDEX "property_images_property_sort_idx" ON "public"."property_images" USING "btree" ("property_id", "sort_order");



CREATE INDEX "property_search_embeddings_embedding_hnsw_idx" ON "public"."property_search_embeddings" USING "hnsw" ("embedding" "extensions"."vector_cosine_ops");



CREATE INDEX "property_search_embeddings_updated_at_idx" ON "public"."property_search_embeddings" USING "btree" ("updated_at" DESC);



CREATE INDEX "room_images_room_sort_idx" ON "public"."room_images" USING "btree" ("room_id", "sort_order");



CREATE INDEX "rooms_property_id_idx" ON "public"."rooms" USING "btree" ("property_id") WHERE ("deleted_at" IS NULL);



CREATE OR REPLACE TRIGGER "bookings_set_updated_at" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "hosts_set_updated_at" BEFORE UPDATE ON "public"."hosts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "housing_requests_set_updated_at" BEFORE UPDATE ON "public"."housing_requests" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "payments_set_updated_at" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "profiles_protect_role" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."protect_profile_role"();



CREATE OR REPLACE TRIGGER "profiles_set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "properties_enqueue_embedding_sync" AFTER INSERT OR UPDATE ON "public"."properties" FOR EACH ROW EXECUTE FUNCTION "private"."enqueue_property_embedding_sync"();



CREATE OR REPLACE TRIGGER "properties_mark_embedding_sync_pending" BEFORE INSERT OR UPDATE ON "public"."properties" FOR EACH ROW EXECUTE FUNCTION "private"."mark_property_embedding_sync_pending"();



CREATE OR REPLACE TRIGGER "properties_set_updated_at" BEFORE UPDATE ON "public"."properties" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "property_amenities_enqueue_embedding_sync" AFTER INSERT OR DELETE OR UPDATE ON "public"."property_amenities" FOR EACH ROW EXECUTE FUNCTION "private"."enqueue_property_embedding_sync_from_related"();



CREATE OR REPLACE TRIGGER "rooms_enqueue_embedding_sync" AFTER INSERT OR DELETE OR UPDATE ON "public"."rooms" FOR EACH ROW EXECUTE FUNCTION "private"."enqueue_property_embedding_sync_from_related"();



CREATE OR REPLACE TRIGGER "rooms_set_updated_at" BEFORE UPDATE ON "public"."rooms" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "rooms_sync_property_monthly_price_min" AFTER INSERT OR DELETE OR UPDATE ON "public"."rooms" FOR EACH ROW EXECUTE FUNCTION "public"."sync_property_monthly_price_min"();



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."booking_price_snapshots"
    ADD CONSTRAINT "booking_price_snapshots_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."hosts"
    ADD CONSTRAINT "hosts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."housing_requests"
    ADD CONSTRAINT "housing_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_events"
    ADD CONSTRAINT "payment_events_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_events"
    ADD CONSTRAINT "payment_events_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."hosts"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."property_amenities"
    ADD CONSTRAINT "property_amenities_amenity_id_fkey" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_amenities"
    ADD CONSTRAINT "property_amenities_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_images"
    ADD CONSTRAINT "property_images_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_search_embeddings"
    ADD CONSTRAINT "property_search_embeddings_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_images"
    ADD CONSTRAINT "room_images_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



CREATE POLICY "Active hosts are publicly readable" ON "public"."hosts" FOR SELECT TO "authenticated", "anon" USING ((("deleted_at" IS NULL) AND ("status" = 'active'::"public"."host_status")));



CREATE POLICY "Admins can manage all bookings" ON "public"."bookings" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all payments" ON "public"."payments" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all properties" ON "public"."properties" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all property amenities" ON "public"."property_amenities" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all property images" ON "public"."property_images" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all room images" ON "public"."room_images" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all rooms" ON "public"."rooms" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage amenities" ON "public"."amenities" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage hosts" ON "public"."hosts" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage location aliases" ON "public"."location_aliases" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage platform settings" ON "public"."platform_settings" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can view all bookings" ON "public"."bookings" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins can view all properties" ON "public"."properties" FOR SELECT TO "authenticated" USING ((("deleted_at" IS NULL) AND "public"."is_admin"()));



CREATE POLICY "Admins can view audit logs" ON "public"."audit_logs" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins can view payment events" ON "public"."payment_events" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins manage housing requests" ON "public"."housing_requests" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Amenities are publicly readable" ON "public"."amenities" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Amenities on published properties are publicly readable" ON "public"."property_amenities" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."properties" "p"
  WHERE (("p"."id" = "property_amenities"."property_id") AND ("p"."deleted_at" IS NULL) AND ("p"."status" = 'published'::"public"."property_status")))));



CREATE POLICY "Anyone can submit housing requests" ON "public"."housing_requests" FOR INSERT TO "authenticated", "anon" WITH CHECK ((("customer_id" IS NULL) OR ("customer_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Authenticated users can read platform settings" ON "public"."platform_settings" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Customers can create their own bookings via RPC" ON "public"."bookings" FOR INSERT TO "authenticated" WITH CHECK (("customer_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Customers can view own housing requests" ON "public"."housing_requests" FOR SELECT TO "authenticated" USING (("customer_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Customers can view their booking price snapshots" ON "public"."booking_price_snapshots" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "booking_price_snapshots"."booking_id") AND (("b"."customer_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_host_of_property"("b"."property_id") OR "public"."is_admin"())))));



CREATE POLICY "Customers can view their own bookings" ON "public"."bookings" FOR SELECT TO "authenticated" USING (("customer_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Customers can view their own payments" ON "public"."payments" FOR SELECT TO "authenticated" USING (("customer_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Embeddings for published properties are publicly readable" ON "public"."property_search_embeddings" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."properties" "p"
  WHERE (("p"."id" = "property_search_embeddings"."property_id") AND ("p"."status" = 'published'::"public"."property_status") AND ("p"."deleted_at" IS NULL)))));



CREATE POLICY "Hosts can insert their own properties" ON "public"."properties" FOR INSERT TO "authenticated" WITH CHECK ((("deleted_at" IS NULL) AND ("host_id" = "public"."current_host_id"()) AND ("status" = 'draft'::"public"."property_status")));



CREATE POLICY "Hosts can manage amenities on their properties" ON "public"."property_amenities" TO "authenticated" USING ("public"."is_host_of_property"("property_id")) WITH CHECK ("public"."is_host_of_property"("property_id"));



CREATE POLICY "Hosts can manage images on their properties" ON "public"."property_images" TO "authenticated" USING ("public"."is_host_of_property"("property_id")) WITH CHECK ("public"."is_host_of_property"("property_id"));



CREATE POLICY "Hosts can manage images on their rooms" ON "public"."room_images" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."rooms" "r"
  WHERE (("r"."id" = "room_images"."room_id") AND "public"."is_host_of_property"("r"."property_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."rooms" "r"
  WHERE (("r"."id" = "room_images"."room_id") AND "public"."is_host_of_property"("r"."property_id")))));



CREATE POLICY "Hosts can manage rooms on their properties" ON "public"."rooms" TO "authenticated" USING ("public"."is_host_of_property"("property_id")) WITH CHECK ("public"."is_host_of_property"("property_id"));



CREATE POLICY "Hosts can update their own draft or pending properties" ON "public"."properties" FOR UPDATE TO "authenticated" USING ((("deleted_at" IS NULL) AND "public"."is_host_of_property"("id") AND ("status" = ANY (ARRAY['draft'::"public"."property_status", 'pending_review'::"public"."property_status"])))) WITH CHECK ((("deleted_at" IS NULL) AND "public"."is_host_of_property"("id") AND ("status" = ANY (ARRAY['draft'::"public"."property_status", 'pending_review'::"public"."property_status"]))));



CREATE POLICY "Hosts can view bookings on their properties" ON "public"."bookings" FOR SELECT TO "authenticated" USING ("public"."is_host_of_property"("property_id"));



CREATE POLICY "Hosts can view payments on their properties" ON "public"."payments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "payments"."booking_id") AND "public"."is_host_of_property"("b"."property_id")))));



CREATE POLICY "Hosts can view their own host profile" ON "public"."hosts" FOR SELECT TO "authenticated" USING ((("deleted_at" IS NULL) AND ("profile_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Hosts can view their own properties" ON "public"."properties" FOR SELECT TO "authenticated" USING ((("deleted_at" IS NULL) AND "public"."is_host_of_property"("id")));



CREATE POLICY "Images of published properties are publicly readable" ON "public"."property_images" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."properties" "p"
  WHERE (("p"."id" = "property_images"."property_id") AND ("p"."deleted_at" IS NULL) AND ("p"."status" = 'published'::"public"."property_status")))));



CREATE POLICY "Images of published rooms are publicly readable" ON "public"."room_images" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM ("public"."rooms" "r"
     JOIN "public"."properties" "p" ON (("p"."id" = "r"."property_id")))
  WHERE (("r"."id" = "room_images"."room_id") AND ("r"."deleted_at" IS NULL) AND ("p"."deleted_at" IS NULL) AND ("p"."status" = 'published'::"public"."property_status")))));



CREATE POLICY "Location aliases are publicly readable" ON "public"."location_aliases" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Profiles are viewable by owner or admin" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("deleted_at" IS NULL) AND (("id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin"())));



CREATE POLICY "Published properties are publicly readable" ON "public"."properties" FOR SELECT TO "authenticated", "anon" USING ((("deleted_at" IS NULL) AND ("status" = 'published'::"public"."property_status")));



CREATE POLICY "Rooms of published properties are publicly readable" ON "public"."rooms" FOR SELECT TO "authenticated", "anon" USING ((("deleted_at" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."properties" "p"
  WHERE (("p"."id" = "rooms"."property_id") AND ("p"."deleted_at" IS NULL) AND ("p"."status" = 'published'::"public"."property_status"))))));



CREATE POLICY "Service role manages property search embeddings" ON "public"."property_search_embeddings" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can mark their own notifications as read" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("deleted_at" IS NULL) AND ("id" = ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK ((("deleted_at" IS NULL) AND ("id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."amenities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_rate_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_price_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hosts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."housing_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."location_aliases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."platform_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_amenities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_search_embeddings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."room_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rooms" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."properties" TO "anon";
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."properties" TO "authenticated";
GRANT ALL ON TABLE "public"."properties" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."bookings" TO "anon";
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_booking_request"("p_booking_id" "uuid") TO "authenticated";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."hosts" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."hosts" TO "authenticated";
GRANT ALL ON TABLE "public"."hosts" TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_host"("p_host_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."assert_rate_limit"("p_bucket" "text", "p_max_requests" integer, "p_window_seconds" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."assert_rate_limit"("p_bucket" "text", "p_max_requests" integer, "p_window_seconds" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."build_property_search_document"("p_property_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cancel_own_booking"("p_booking_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."create_booking_hold"("p_room_id" "uuid", "p_check_in" "date", "p_check_out" "date", "p_guest_count" integer, "p_customer_notes" "text") TO "authenticated";



GRANT ALL ON FUNCTION "public"."create_payment_order"("p_booking_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."expire_booking_holds"() TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."payments" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON FUNCTION "public"."finalize_successful_payment"("p_order_id" "uuid", "p_payment_key" "text", "p_amount_krw" integer, "p_toss_response" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_host_property_coordinates"("p_property_id" "uuid") TO "authenticated";



GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."platform_settings" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."platform_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_settings" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_property_coordinates"("p_property_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_property_coordinates"("p_property_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_unread_notification_count"() TO "authenticated";



GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"() TO "authenticated";



GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."notifications" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."mark_payment_failed"("p_order_id" "uuid", "p_reason" "text", "p_toss_response" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."publish_property"("p_property_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."quote_booking"("p_room_id" "uuid", "p_check_in" "date", "p_check_out" "date", "p_guest_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."quote_booking"("p_room_id" "uuid", "p_check_in" "date", "p_check_out" "date", "p_guest_count" integer) TO "authenticated";



GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."payment_events" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."payment_events" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_events" TO "service_role";



GRANT ALL ON FUNCTION "public"."record_payment_event"("p_event_id" "text", "p_payment_id" "uuid", "p_booking_id" "uuid", "p_event_type" "text", "p_payload" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."register_as_host"("p_display_name" "text") TO "authenticated";



GRANT ALL ON FUNCTION "public"."reject_booking_request"("p_booking_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."reject_property_review"("p_property_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."retry_pending_property_embedding_syncs"("p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_properties"("p_filters" "jsonb", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_properties"("p_filters" "jsonb", "p_limit" integer, "p_offset" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."search_properties_hybrid"("p_filters" "jsonb", "p_limit" integer, "p_offset" integer, "p_query_embedding" "extensions"."vector", "p_reference_embedding" "extensions"."vector", "p_match_threshold" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."search_properties_hybrid"("p_filters" "jsonb", "p_limit" integer, "p_offset" integer, "p_query_embedding" "extensions"."vector", "p_reference_embedding" "extensions"."vector", "p_match_threshold" double precision) TO "authenticated";



GRANT ALL ON FUNCTION "public"."set_property_location"("p_property_id" "uuid", "p_latitude" double precision, "p_longitude" double precision) TO "authenticated";



GRANT ALL ON FUNCTION "public"."submit_property_for_review"("p_property_id" "uuid") TO "authenticated";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."housing_requests" TO "anon";
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."housing_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."housing_requests" TO "service_role";



GRANT ALL ON FUNCTION "public"."update_housing_request_status"("p_request_id" "uuid", "p_status" "public"."housing_request_status") TO "authenticated";



GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."audit_logs" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON FUNCTION "public"."write_audit_log"("p_action" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_metadata" "jsonb") TO "authenticated";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."amenities" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."amenities" TO "authenticated";
GRANT ALL ON TABLE "public"."amenities" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."api_rate_limits" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."api_rate_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."api_rate_limits" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."booking_price_snapshots" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."booking_price_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_price_snapshots" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."location_aliases" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."location_aliases" TO "authenticated";
GRANT ALL ON TABLE "public"."location_aliases" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."profiles" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."property_amenities" TO "anon";
GRANT ALL ON TABLE "public"."property_amenities" TO "authenticated";
GRANT ALL ON TABLE "public"."property_amenities" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."property_images" TO "anon";
GRANT ALL ON TABLE "public"."property_images" TO "authenticated";
GRANT ALL ON TABLE "public"."property_images" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."property_search_embeddings" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."property_search_embeddings" TO "authenticated";
GRANT ALL ON TABLE "public"."property_search_embeddings" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."room_images" TO "anon";
GRANT ALL ON TABLE "public"."room_images" TO "authenticated";
GRANT ALL ON TABLE "public"."room_images" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."rooms" TO "anon";
GRANT ALL ON TABLE "public"."rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."rooms" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT UPDATE ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT UPDATE ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT UPDATE ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLES  TO "service_role";






