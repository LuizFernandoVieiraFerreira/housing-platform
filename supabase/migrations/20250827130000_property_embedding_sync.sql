-- Automatic property embedding sync via pg_net + retry cron

create schema if not exists private;

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

create type public.property_embedding_sync_status as enum (
  'pending',
  'synced',
  'failed',
  'not_applicable'
);

alter table public.properties
  add column if not exists embedding_sync_status public.property_embedding_sync_status,
  add column if not exists embedding_sync_requested_at timestamptz,
  add column if not exists embedding_synced_at timestamptz,
  add column if not exists embedding_sync_error text,
  add column if not exists embedding_sync_attempts integer not null default 0;

create index if not exists properties_embedding_sync_status_idx
on public.properties (embedding_sync_status, embedding_sync_requested_at)
where status = 'published' and deleted_at is null;

create or replace function private.get_vault_secret(p_name text)
returns text
language plpgsql
security definer
set search_path = vault, pg_catalog
as $$
declare
  secret_value text;
begin
  select decrypted_secret
  into secret_value
  from vault.decrypted_secrets
  where name = p_name
  limit 1;

  return secret_value;
end;
$$;

revoke all on function private.get_vault_secret(text) from public;

create or replace function private.should_defer_property_embedding_sync()
returns boolean
language sql
stable
as $$
  select coalesce(current_setting('hik.defer_embedding_sync', true), 'off') = 'on';
$$;

revoke all on function private.should_defer_property_embedding_sync() from public;

create or replace function private.property_search_fields_changed(
  p_old public.properties,
  p_new public.properties
)
returns boolean
language sql
immutable
as $$
  select
    p_old.title is distinct from p_new.title
    or p_old.description is distinct from p_new.description
    or p_old.property_type is distinct from p_new.property_type
    or p_old.district is distinct from p_new.district
    or p_old.city is distinct from p_new.city
    or p_old.nearest_station_name is distinct from p_new.nearest_station_name
    or p_old.nearest_station_walk_min is distinct from p_new.nearest_station_walk_min
    or p_old.tags is distinct from p_new.tags
    or p_old.min_stay_nights is distinct from p_new.min_stay_nights
    or p_old.status is distinct from p_new.status;
$$;

revoke all on function private.property_search_fields_changed(public.properties, public.properties) from public;

create or replace function private.invoke_property_embedding_sync(p_property_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public, extensions, vault, private, pg_catalog
as $$
declare
  service_role_key text;
  supabase_url text;
  request_id bigint;
begin
  service_role_key := private.get_vault_secret('service_role_key');
  supabase_url := private.get_vault_secret('supabase_url');

  if service_role_key is null or supabase_url is null then
    raise warning 'Embedding sync vault secrets are not configured';
    return null;
  end if;

  select net.http_post(
    url := supabase_url || '/functions/v1/sync-property-embedding',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key,
      'apikey', service_role_key
    ),
    body := jsonb_build_object('propertyId', p_property_id),
    timeout_milliseconds := 120000
  )
  into request_id;

  return request_id;
end;
$$;

revoke all on function private.invoke_property_embedding_sync(uuid) from public;

create or replace function private.mark_property_embedding_sync_pending()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
begin
  if TG_OP = 'DELETE' then
    return OLD;
  end if;

  if NEW.deleted_at is not null or NEW.status <> 'published'::public.property_status then
    NEW.embedding_sync_status := 'not_applicable';
    NEW.embedding_sync_error := null;
    return NEW;
  end if;

  if TG_OP = 'UPDATE'
    and OLD.status = 'published'::public.property_status
    and NEW.status = 'published'::public.property_status
    and not private.property_search_fields_changed(OLD, NEW)
    and NEW.embedding_sync_status = 'synced'::public.property_embedding_sync_status then
    return NEW;
  end if;

  NEW.embedding_sync_status := 'pending';
  NEW.embedding_sync_requested_at := timezone('utc', now());
  NEW.embedding_sync_error := null;

  return NEW;
end;
$$;

create or replace function private.enqueue_property_embedding_sync()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
begin
  if TG_OP = 'DELETE' then
    return OLD;
  end if;

  if NEW.deleted_at is not null or NEW.status <> 'published'::public.property_status then
    return NEW;
  end if;

  if NEW.embedding_sync_status <> 'pending'::public.property_embedding_sync_status then
    return NEW;
  end if;

  if private.should_defer_property_embedding_sync() then
    return NEW;
  end if;

  perform private.invoke_property_embedding_sync(NEW.id);

  return NEW;
end;
$$;

create or replace function private.enqueue_property_embedding_sync_from_related()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare
  target_property_id uuid;
begin
  target_property_id := coalesce(
    case when TG_OP = 'DELETE' then OLD.property_id else NEW.property_id end,
    null
  );

  if target_property_id is null then
    return coalesce(NEW, OLD);
  end if;

  update public.properties
  set
    embedding_sync_status = 'pending',
    embedding_sync_requested_at = timezone('utc', now()),
    embedding_sync_error = null
  where id = target_property_id
    and deleted_at is null
    and status = 'published'::public.property_status;

  if not found then
    return coalesce(NEW, OLD);
  end if;

  if private.should_defer_property_embedding_sync() then
    return coalesce(NEW, OLD);
  end if;

  perform private.invoke_property_embedding_sync(target_property_id);

  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists properties_mark_embedding_sync_pending on public.properties;
create trigger properties_mark_embedding_sync_pending
before insert or update on public.properties
for each row
execute function private.mark_property_embedding_sync_pending();

drop trigger if exists properties_enqueue_embedding_sync on public.properties;
create trigger properties_enqueue_embedding_sync
after insert or update on public.properties
for each row
execute function private.enqueue_property_embedding_sync();

drop trigger if exists property_amenities_enqueue_embedding_sync on public.property_amenities;
create trigger property_amenities_enqueue_embedding_sync
after insert or update or delete on public.property_amenities
for each row
execute function private.enqueue_property_embedding_sync_from_related();

drop trigger if exists rooms_enqueue_embedding_sync on public.rooms;
create trigger rooms_enqueue_embedding_sync
after insert or update or delete on public.rooms
for each row
execute function private.enqueue_property_embedding_sync_from_related();

create or replace function public.retry_pending_property_embedding_syncs(p_limit integer default 20)
returns integer
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
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

grant execute on function public.retry_pending_property_embedding_syncs(integer) to service_role;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'retry-property-embedding-syncs') then
    perform cron.unschedule('retry-property-embedding-syncs');
  end if;
end;
$$;

select cron.schedule(
  'retry-property-embedding-syncs',
  '*/5 * * * *',
  $$select public.retry_pending_property_embedding_syncs(25);$$
);

comment on function public.retry_pending_property_embedding_syncs(integer) is
  'Invokes sync-property-embedding for pending/failed published listings. Used by pg_cron and ops backfills.';
