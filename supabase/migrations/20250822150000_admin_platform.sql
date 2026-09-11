-- Phase 9: admin operations — housing requests, audit logs, host approval

create type public.housing_request_status as enum ('new', 'in_progress', 'closed');

create table public.housing_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles (id) on delete set null,
  email text not null,
  desired_area text not null,
  check_in date,
  check_out date,
  budget_max integer,
  accommodation_type public.accommodation_type,
  notes text,
  status public.housing_request_status not null default 'new',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint housing_requests_email_not_blank check (char_length(trim(email)) > 0),
  constraint housing_requests_desired_area_not_blank check (char_length(trim(desired_area)) > 0),
  constraint housing_requests_budget_positive check (budget_max is null or budget_max > 0)
);

create index housing_requests_status_idx on public.housing_requests (status, created_at desc);

create index housing_requests_customer_id_idx on public.housing_requests (customer_id);

create trigger housing_requests_set_updated_at
before update on public.housing_requests
for each row
execute function public.set_updated_at();

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles (id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint audit_logs_action_not_blank check (char_length(trim(action)) > 0),
  constraint audit_logs_entity_type_not_blank check (char_length(trim(entity_type)) > 0)
);

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

create or replace function public.write_audit_log(
  p_action text,
  p_entity_type text,
  p_entity_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.audit_logs
language plpgsql
security definer
set search_path = public
as $$
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

  perform public.write_audit_log(
    'property.published',
    'property',
    updated_property.id,
    jsonb_build_object('title', updated_property.title, 'slug', updated_property.slug)
  );

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

  perform public.write_audit_log(
    'property.review_rejected',
    'property',
    updated_property.id,
    jsonb_build_object('title', updated_property.title, 'slug', updated_property.slug)
  );

  return updated_property;
end;
$$;

create or replace function public.approve_host(p_host_id uuid)
returns public.hosts
language plpgsql
security definer
set search_path = public
as $$
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

create or replace function public.update_housing_request_status(
  p_request_id uuid,
  p_status public.housing_request_status
)
returns public.housing_requests
language plpgsql
security definer
set search_path = public
as $$
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

alter table public.housing_requests enable row level security;

alter table public.audit_logs enable row level security;

create policy "Anyone can submit housing requests"
on public.housing_requests
for insert
to anon, authenticated
with check (
  customer_id is null
  or customer_id = (select auth.uid())
);

create policy "Customers can view own housing requests"
on public.housing_requests
for select
to authenticated
using (customer_id = (select auth.uid()));

create policy "Admins manage housing requests"
on public.housing_requests
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can view audit logs"
on public.audit_logs
for select
to authenticated
using (public.is_admin());

grant select, insert, update on public.housing_requests to anon, authenticated;
grant select on public.audit_logs to authenticated;
grant all on public.housing_requests to service_role;
grant all on public.audit_logs to service_role;

grant execute on function public.write_audit_log(text, text, uuid, jsonb) to authenticated;
grant execute on function public.approve_host(uuid) to authenticated;
grant execute on function public.update_housing_request_status(uuid, public.housing_request_status) to authenticated;
