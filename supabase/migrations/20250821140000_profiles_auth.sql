-- Phase 2: profiles, auth trigger, and RLS

create type public.user_role as enum ('customer', 'host', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'customer',
  full_name text not null,
  phone text,
  avatar_url text,
  preferred_language text not null default 'en',
  marketing_consent boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_full_name_not_blank check (char_length(trim(full_name)) > 0),
  constraint profiles_preferred_language_not_blank check (char_length(trim(preferred_language)) > 0)
);

create index profiles_role_idx on public.profiles (role)
where
  deleted_at is null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and deleted_at is null
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if old.role is distinct from new.role and not public.is_admin() then
    new.role := old.role;
  end if;

  return new;
end;
$$;

create trigger profiles_protect_role
before update on public.profiles
for each row
execute function public.protect_profile_role();

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner or admin"
on public.profiles
for select
to authenticated
using (
  deleted_at is null
  and (
    id = (select auth.uid())
    or public.is_admin()
  )
);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (
  deleted_at is null
  and id = (select auth.uid())
)
with check (
  deleted_at is null
  and id = (select auth.uid())
);

grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
