-- Synthetic dev seed for Housing Platform (deterministic, idempotent via ON CONFLICT)
--
-- Dev accounts (shared password: 1234qwer)
--   admin@gmail.com                        — admin console
--   host@gmail.com                         — primary host (Seoul Stay Host)
--   host2@gmail.com                        — secondary host (Han River Homes)
--   luizfernandovieiraferreira@gmail.com   — customer (bookings, checkout)
--
-- Catalog totals after reset:
--   9 amenities · 2 hosts · 42 published properties · 3 workflow listings
--   ~58 rooms · 42 cover images · 4 housing request leads
--
-- Regenerate bulk catalog: node supabase/seed/generate-catalog.mjs

insert into public.amenities (id, slug, name, icon, sort_order)
values
  ('11111111-1111-4111-8111-111111111101', 'wifi', 'Wi-Fi', 'wifi', 1),
  ('11111111-1111-4111-8111-111111111102', 'desk', 'Desk', 'desk', 2),
  ('11111111-1111-4111-8111-111111111103', 'air-conditioning', 'Air conditioning', 'snowflake', 3),
  ('11111111-1111-4111-8111-111111111104', 'washing-machine', 'Washing machine', 'washer', 4),
  ('11111111-1111-4111-8111-111111111105', 'kitchen', 'Kitchen', 'utensils', 5),
  ('11111111-1111-4111-8111-111111111106', 'elevator', 'Elevator', 'elevator', 6),
  ('11111111-1111-4111-8111-111111111107', 'parking', 'Parking', 'car', 7),
  ('11111111-1111-4111-8111-111111111108', 'balcony', 'Balcony', 'sun', 8),
  ('11111111-1111-4111-8111-111111111109', 'heating', 'Heating', 'thermometer', 9)
on conflict (slug) do nothing;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222201',
    'authenticated',
    'authenticated',
    'host@gmail.com',
    crypt('1234qwer', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Seoul Stay Host"}',
    timezone('utc', now()),
    timezone('utc', now()),
    '',
    '',
    '',
    ''
  )
on conflict (id) do nothing;

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    '22222222-2222-4222-8222-222222222201',
    '22222222-2222-4222-8222-222222222201',
    format(
      '{"sub":"%s","email":"%s"}',
      '22222222-2222-4222-8222-222222222201',
      'host@gmail.com'
    )::jsonb,
    'email',
    '22222222-2222-4222-8222-222222222201',
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  )
on conflict (id) do nothing;

alter table public.profiles disable trigger profiles_protect_role;

update public.profiles
set
  role = 'host',
  full_name = 'Seoul Stay Host'
where id = '22222222-2222-4222-8222-222222222201';

alter table public.profiles enable trigger profiles_protect_role;

insert into public.hosts (id, profile_id, display_name, status, verified_at)
values
  (
    '33333333-3333-4333-8333-333333333301',
    '22222222-2222-4222-8222-222222222201',
    'Seoul Stay Host',
    'active',
    timezone('utc', now())
  )
on conflict (profile_id) do nothing;

-- Secondary host for catalog variety
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222202',
    'authenticated',
    'authenticated',
    'host2@gmail.com',
    crypt('1234qwer', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Han River Homes"}',
    timezone('utc', now()),
    timezone('utc', now()),
    '',
    '',
    '',
    ''
  )
on conflict (id) do nothing;

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    '22222222-2222-4222-8222-222222222202',
    '22222222-2222-4222-8222-222222222202',
    format(
      '{"sub":"%s","email":"%s"}',
      '22222222-2222-4222-8222-222222222202',
      'host2@gmail.com'
    )::jsonb,
    'email',
    '22222222-2222-4222-8222-222222222202',
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  )
on conflict (id) do nothing;

alter table public.profiles disable trigger profiles_protect_role;

update public.profiles
set
  role = 'host',
  full_name = 'Han River Homes'
where id = '22222222-2222-4222-8222-222222222202';

alter table public.profiles enable trigger profiles_protect_role;

insert into public.hosts (id, profile_id, display_name, status, verified_at)
values
  (
    '33333333-3333-4333-8333-333333333302',
    '22222222-2222-4222-8222-222222222202',
    'Han River Homes',
    'active',
    timezone('utc', now())
  )
on conflict (profile_id) do nothing;

insert into public.properties (
  id,
  host_id,
  title,
  slug,
  description,
  property_type,
  address_line1,
  city,
  country,
  location,
  district,
  nearest_station_name,
  nearest_station_walk_min,
  status,
  booking_mode,
  min_stay_nights,
  is_featured,
  tags,
  published_at
)
values
  (
    '44444444-4444-4444-8444-444444444401',
    '33333333-3333-4333-8333-333333333301',
    'Bright studio near Hongdae',
    'bright-studio-near-hongdae',
    'Bright flagship studio with natural light near Hongdae. Dedicated desk, fast Wi-Fi, and seven-minute walk to Hongik Univ. Station—reference listing for similar-but-cheaper searches.',
    'studio',
    '12 Wausan-ro 29-gil',
    'Seoul',
    'KR',
    extensions.st_setsrid(extensions.st_makepoint(126.922, 37.5563), 4326)::extensions.geography,
    'Mapo-gu',
    'Hongik Univ. Station',
    7,
    'published',
    'instant',
    30,
    true,
    array['#Hongdae', '#Exchange', '#RemoteWork', '#NoDeposit'],
    timezone('utc', now())
  ),
  (
    '44444444-4444-4444-8444-444444444402',
    '33333333-3333-4333-8333-333333333301',
    'Share-house with rooftop lounge',
    'share-house-with-rooftop-lounge',
    'Social share-house with shared kitchen, rooftop lounge, and private lockable rooms for long stays.',
    'share-house',
    '45 Gangnam-daero 98-gil',
    'Seoul',
    'KR',
    extensions.st_setsrid(extensions.st_makepoint(127.0276, 37.4979), 4326)::extensions.geography,
    'Gangnam-gu',
    'Gangnam Station',
    5,
    'published',
    'request',
    30,
    true,
    array['#Gangnam', '#Social'],
    timezone('utc', now())
  ),
  (
    '44444444-4444-4444-8444-444444444403',
    '33333333-3333-4333-8333-333333333301',
    'Micro studio by SNU',
    'micro-studio-by-snu',
    'Efficient micro studio close to Seoul National University with desk space and fast Wi-Fi.',
    'micro-studio',
    '88 Gwanak-ro',
    'Seoul',
    'KR',
    extensions.st_setsrid(extensions.st_makepoint(126.9526, 37.4596), 4326)::extensions.geography,
    'Gwanak-gu',
    'Seoul National Univ. Station',
    10,
    'published',
    'instant',
    30,
    true,
    array['#SNU', '#Student'],
    timezone('utc', now())
  ),
  (
    '44444444-4444-4444-8444-444444444404',
    '33333333-3333-4333-8333-333333333301',
    'Family-friendly multi-bedroom flat',
    'family-friendly-multi-bedroom-flat',
    'Two-bedroom apartment suitable for couples or small groups staying a full semester in Korea.',
    'multi-bedroom',
    '3 Olympic-ro 35-gil',
    'Seoul',
    'KR',
    extensions.st_setsrid(extensions.st_makepoint(127.073, 37.5172), 4326)::extensions.geography,
    'Songpa-gu',
    'Jamsil Station',
    8,
    'published',
    'request',
    30,
    true,
    array['#Family', '#Jamsil'],
    timezone('utc', now())
  )
on conflict (id) do nothing;

insert into public.rooms (
  id,
  property_id,
  name,
  room_type,
  size_sqm,
  max_occupancy,
  monthly_price_krw,
  status,
  available_from
)
values
  (
    '55555555-5555-4555-8555-555555555501',
    '44444444-4444-4444-8444-444444444401',
    'Studio room',
    'private',
    18.5,
    1,
    980000,
    'available',
    null
  ),
  (
    '55555555-5555-4555-8555-555555555502',
    '44444444-4444-4444-8444-444444444402',
    'Private room A',
    'private',
    12.0,
    1,
    650000,
    'available',
    null
  ),
  (
    '55555555-5555-4555-8555-555555555503',
    '44444444-4444-4444-8444-444444444402',
    'Private room B',
    'private',
    11.0,
    1,
    620000,
    'available',
    current_date + 21
  ),
  (
    '55555555-5555-4555-8555-555555555504',
    '44444444-4444-4444-8444-444444444403',
    'Micro studio',
    'private',
    9.5,
    1,
    720000,
    'available',
    current_date + 14
  ),
  (
    '55555555-5555-4555-8555-555555555505',
    '44444444-4444-4444-8444-444444444404',
    'Master bedroom',
    'private',
    14.0,
    2,
    1100000,
    'available',
    null
  ),
  (
    '55555555-5555-4555-8555-555555555506',
    '44444444-4444-4444-8444-444444444404',
    'Second bedroom',
    'private',
    11.5,
    1,
    900000,
    'available',
    current_date + 30
  )
on conflict (id) do nothing;

-- Idempotent corrections when seed re-runs without db reset
update public.rooms
set
  monthly_price_krw = 980000,
  available_from = null
where id = '55555555-5555-4555-8555-555555555501';

update public.rooms
set available_from = null
where id = '55555555-5555-4555-8555-555555555502';

update public.rooms
set available_from = current_date + 21
where id = '55555555-5555-4555-8555-555555555503';

update public.rooms
set available_from = current_date + 14
where id = '55555555-5555-4555-8555-555555555504';

update public.rooms
set available_from = null
where id = '55555555-5555-4555-8555-555555555505';

update public.rooms
set available_from = current_date + 30
where id = '55555555-5555-4555-8555-555555555506';

insert into public.property_images (id, property_id, storage_path, sort_order, alt_text, is_cover)
values
  (
    '66666666-6666-4666-8666-666666666601',
    '44444444-4444-4444-8444-444444444401',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    0,
    'Bright studio living space near Hongdae',
    true
  ),
  (
    '66666666-6666-4666-8666-666666666602',
    '44444444-4444-4444-8444-444444444402',
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
    0,
    'Shared lounge in a Seoul share-house',
    true
  ),
  (
    '66666666-6666-4666-8666-666666666603',
    '44444444-4444-4444-8444-444444444403',
    'https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80',
    0,
    'Compact micro studio with desk',
    true
  ),
  (
    '66666666-6666-4666-8666-666666666604',
    '44444444-4444-4444-8444-444444444404',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
    0,
    'Multi-bedroom apartment living room',
    true
  )
on conflict (id) do nothing;

insert into public.property_amenities (property_id, amenity_id)
values
  ('44444444-4444-4444-8444-444444444401', '11111111-1111-4111-8111-111111111101'),
  ('44444444-4444-4444-8444-444444444401', '11111111-1111-4111-8111-111111111102'),
  ('44444444-4444-4444-8444-444444444401', '11111111-1111-4111-8111-111111111103'),
  ('44444444-4444-4444-8444-444444444402', '11111111-1111-4111-8111-111111111101'),
  ('44444444-4444-4444-8444-444444444402', '11111111-1111-4111-8111-111111111105'),
  ('44444444-4444-4444-8444-444444444402', '11111111-1111-4111-8111-111111111106'),
  ('44444444-4444-4444-8444-444444444403', '11111111-1111-4111-8111-111111111101'),
  ('44444444-4444-4444-8444-444444444403', '11111111-1111-4111-8111-111111111102'),
  ('44444444-4444-4444-8444-444444444404', '11111111-1111-4111-8111-111111111101'),
  ('44444444-4444-4444-8444-444444444404', '11111111-1111-4111-8111-111111111104'),
  ('44444444-4444-4444-8444-444444444404', '11111111-1111-4111-8111-111111111105')
on conflict do nothing;

-- Draft listing to demonstrate publish workflow (not shown on home until published)
insert into public.properties (
  id,
  host_id,
  title,
  slug,
  description,
  property_type,
  address_line1,
  city,
  country,
  location,
  district,
  nearest_station_name,
  nearest_station_walk_min,
  status,
  booking_mode,
  min_stay_nights,
  is_featured,
  tags
)
values
  (
    '44444444-4444-4444-8444-444444444499',
    '33333333-3333-4333-8333-333333333301',
    'Draft listing pending review',
    'draft-listing-pending-review',
    'This property stays hidden until an admin publishes it after review.',
    'studio',
    '1 Example-ro',
    'Seoul',
    'KR',
    extensions.st_setsrid(extensions.st_makepoint(126.978, 37.5665), 4326)::extensions.geography,
    'Jung-gu',
    'City Hall Station',
    4,
    'pending_review',
    'request',
    30,
    false,
    array['#Draft']
  )
on conflict (id) do nothing;

insert into public.rooms (
  id,
  property_id,
  name,
  room_type,
  size_sqm,
  max_occupancy,
  monthly_price_krw,
  status
)
values
  (
    '55555555-5555-4555-8555-555555555599',
    '44444444-4444-4444-8444-444444444499',
    'Draft studio room',
    'private',
    10.0,
    1,
    700000,
    'available'
  )
on conflict (id) do nothing;

-- Phase 9 seed: demo admin account and housing request leads

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '88888888-8888-4888-8888-888888888801',
    'authenticated',
    'authenticated',
    'admin@gmail.com',
    crypt('1234qwer', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Platform Admin"}',
    timezone('utc', now()),
    timezone('utc', now()),
    '',
    '',
    '',
    ''
  )
on conflict (id) do nothing;

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    '88888888-8888-4888-8888-888888888801',
    '88888888-8888-4888-8888-888888888801',
    format(
      '{"sub":"%s","email":"%s"}',
      '88888888-8888-4888-8888-888888888801',
      'admin@gmail.com'
    )::jsonb,
    'email',
    '88888888-8888-4888-8888-888888888801',
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  )
on conflict (id) do nothing;

alter table public.profiles disable trigger profiles_protect_role;

update public.profiles
set
  role = 'admin',
  full_name = 'Platform Admin'
where id = '88888888-8888-4888-8888-888888888801';

alter table public.profiles enable trigger profiles_protect_role;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '99999999-9999-4999-8999-999999999901',
    'authenticated',
    'authenticated',
    'luizfernandovieiraferreira@gmail.com',
    crypt('1234qwer', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Luiz Ferreira"}',
    timezone('utc', now()),
    timezone('utc', now()),
    '',
    '',
    '',
    ''
  )
on conflict (id) do nothing;

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    '99999999-9999-4999-8999-999999999901',
    '99999999-9999-4999-8999-999999999901',
    format(
      '{"sub":"%s","email":"%s"}',
      '99999999-9999-4999-8999-999999999901',
      'luizfernandovieiraferreira@gmail.com'
    )::jsonb,
    'email',
    '99999999-9999-4999-8999-999999999901',
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  )
on conflict (id) do nothing;

update public.profiles
set full_name = 'Luiz Ferreira'
where id = '99999999-9999-4999-8999-999999999901';

insert into public.housing_requests (
  id,
  email,
  desired_area,
  check_in,
  check_out,
  budget_max,
  accommodation_type,
  notes,
  status
)
values
  (
    '77777777-7777-4777-8777-777777777701',
    'guest@example.com',
    'Hongdae',
    current_date + 30,
    current_date + 120,
    900000,
    'studio',
    'Looking for a furnished studio near Hongik University.',
    'new'
  ),
  (
    '77777777-7777-4777-8777-777777777702',
    'student@example.com',
    'Gangnam',
    current_date + 45,
    current_date + 135,
    1200000,
    'share-house',
    'Prefer a private room in a share house with kitchen access.',
    'in_progress'
  ),
  (
    '77777777-7777-4777-8777-777777777703',
    'remote@example.com',
    'Yeouido',
    current_date + 14,
    current_date + 104,
    1100000,
    'studio',
    'Need a quiet furnished studio with desk space near the subway for remote work.',
    'new'
  ),
  (
    '77777777-7777-4777-8777-777777777704',
    'family@example.com',
    'Songpa',
    current_date + 60,
    current_date + 240,
    1500000,
    'multi-bedroom',
    'Relocating with partner—looking for washer, kitchen, and parking if possible.',
    'new'
  )
on conflict (id) do nothing;
