-- ==============================================================================
-- CRAVE EVENT — SUPABASE PRODUCTION DATABASE SCHEMA & POLICIES
-- Versi: 1.1 (Idempotent: Aman Dijalankan Berulang Kali di Supabase SQL Editor)
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUM TYPES (Idempotent using DO blocks to prevent 'type already exists' error)
do $$ begin
  create type user_role as enum ('user', 'admin', 'superadmin');
exception
  when duplicate_object then null;
end $$;

-- Pastikan value 'superadmin' ditambahkan jika tipe user_role sudah ada sebelumnya
alter type user_role add value if not exists 'superadmin';

do $$ begin
  create type event_type as enum ('free', 'paid');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type event_status as enum ('upcoming', 'ongoing', 'past');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type registration_status as enum ('registered', 'attended', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type payment_status as enum ('free', 'pending', 'paid');
exception
  when duplicate_object then null;
end $$;

-- 3. PROFILES TABLE (Terkoneksi dengan Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  avatar_url text,
  role user_role not null default 'user',
  phone text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexing profiles
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_email on public.profiles(email);

-- 4. PLAYLISTS TABLE
create table if not exists public.playlists (
  id text primary key default 'pl_' || substr(md5(random()::text), 1, 8),
  title text not null,
  description text,
  slug text not null unique,
  icon text,
  sort_order int default 0,
  created_at timestamptz not null default now()
);

-- 5. EVENTS TABLE
create table if not exists public.events (
  id text primary key default 'evt_' || substr(md5(random()::text), 1, 8),
  title text not null,
  description text not null,
  category text not null default 'Webinar',
  type event_type not null default 'free',
  price numeric(12, 2) not null default 0,
  date date not null,
  time text not null,
  duration_minutes integer not null default 90,
  location text not null default 'Online via Zoom',
  speaker_name text not null,
  speaker_role text not null,
  speaker_avatar text,
  quota integer not null default 100,
  zoom_link text,
  playlist text not null default 'English Club',
  rundown jsonb default '[]'::jsonb,
  status event_status not null default 'upcoming',
  attendance_code text not null default upper(substr(md5(random()::text), 1, 6)),
  banner_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_events_date on public.events(date);
create index if not exists idx_events_status on public.events(status);
create index if not exists idx_events_playlist on public.events(playlist);
create index if not exists idx_events_code on public.events(attendance_code);

-- 6. REGISTRATIONS TABLE
create table if not exists public.registrations (
  id text primary key default 'reg_' || substr(md5(random()::text), 1, 10),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id text not null references public.events(id) on delete cascade,
  status registration_status not null default 'registered',
  payment_status payment_status not null default 'free',
  payment_reference text,
  attended_at timestamptz,
  certificate_id text,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

create index if not exists idx_registrations_user on public.registrations(user_id);
create index if not exists idx_registrations_event on public.registrations(event_id);

-- 7. CERTIFICATES TABLE
create table if not exists public.certificates (
  id text primary key default 'cert_' || substr(md5(random()::text), 1, 10),
  certificate_number text not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id text not null references public.events(id) on delete cascade,
  user_name text not null,
  event_title text not null,
  event_date date not null,
  issued_at timestamptz not null default now(),
  verification_url text not null,
  pdf_url text,
  unique (user_id, event_id)
);

create index if not exists idx_certificates_user on public.certificates(user_id);
create index if not exists idx_certificates_number on public.certificates(certificate_number);

-- 8. BLOGS TABLE
create table if not exists public.blogs (
  id text primary key default 'post_' || substr(md5(random()::text), 1, 8),
  title text not null,
  slug text not null unique,
  excerpt text not null,
  content text not null,
  cover_image text,
  author_name text not null default 'Eka Revandi',
  author_avatar text,
  reading_time text default '5 min read',
  is_published boolean default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_blogs_slug on public.blogs(slug);

-- ==============================================================================
-- 9. TRIGGER: AUTO-CREATE PROFILE ON AUTH SIGNUP
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null),
    case
      -- Jika user memilih role superadmin/speaker saat register atau email admin
      when lower(coalesce(new.raw_user_meta_data->>'role', '')) in ('superadmin', 'super admin', 'speaker', 'admin', 'host') then 'admin'::user_role
      when new.email like '%admin%' or new.email like '%superadmin%' or new.email = 'ekarevandi@crave.id' then 'admin'::user_role
      else 'user'::user_role
    end
  )
  on conflict (id) do update set
    name = excluded.name,
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger hook ke auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES (With DROP IF EXISTS to avoid duplicate policy error)
-- ==============================================================================

-- Enable RLS di semua tabel publik
alter table public.profiles enable row level security;
alter table public.playlists enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;
alter table public.certificates enable row level security;
alter table public.blogs enable row level security;

-- PROFILES POLICIES
drop policy if exists "Profil dapat dibaca oleh pengguna login" on public.profiles;
create policy "Profil dapat dibaca oleh pengguna login"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Pengguna dapat mengedit profil sendiri" on public.profiles;
create policy "Pengguna dapat mengedit profil sendiri"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- PLAYLISTS POLICIES (Publik baca, Admin kelola)
drop policy if exists "Semua orang dapat membaca playlist" on public.playlists;
create policy "Semua orang dapat membaca playlist"
  on public.playlists for select
  to anon, authenticated
  using (true);

drop policy if exists "Admin dapat mengubah playlist" on public.playlists;
create policy "Admin dapat mengubah playlist"
  on public.playlists for all
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role::text in ('admin', 'superadmin'))
  );

-- EVENTS POLICIES (Publik baca event, Admin kelola)
drop policy if exists "Semua orang dapat melihat event" on public.events;
create policy "Semua orang dapat melihat event"
  on public.events for select
  to anon, authenticated
  using (true);

drop policy if exists "Admin dapat menambah atau mengedit event" on public.events;
create policy "Admin dapat menambah atau mengedit event"
  on public.events for all
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role::text in ('admin', 'superadmin'))
  );

-- REGISTRATIONS POLICIES
drop policy if exists "Pengguna dapat melihat pendaftaran miliknya" on public.registrations;
create policy "Pengguna dapat melihat pendaftaran miliknya"
  on public.registrations for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role::text in ('admin', 'superadmin'))
  );

drop policy if exists "Pengguna dapat mendaftar event" on public.registrations;
create policy "Pengguna dapat mendaftar event"
  on public.registrations for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Pengguna dapat memperbarui pendaftaran miliknya" on public.registrations;
create policy "Pengguna dapat memperbarui pendaftaran miliknya"
  on public.registrations for update
  to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role::text in ('admin', 'superadmin'))
  );

-- CERTIFICATES POLICIES
drop policy if exists "Semua orang dapat memverifikasi sertifikat publik" on public.certificates;
create policy "Semua orang dapat memverifikasi sertifikat publik"
  on public.certificates for select
  to anon, authenticated
  using (true);

drop policy if exists "Admin atau sistem dapat menerbitkan sertifikat" on public.certificates;
create policy "Admin atau sistem dapat menerbitkan sertifikat"
  on public.certificates for all
  to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role::text in ('admin', 'superadmin'))
  );

-- BLOGS POLICIES
drop policy if exists "Semua orang dapat membaca blog publik" on public.blogs;
create policy "Semua orang dapat membaca blog publik"
  on public.blogs for select
  to anon, authenticated
  using (is_published = true or exists (select 1 from public.profiles where id = auth.uid() and role::text in ('admin', 'superadmin')));

drop policy if exists "Admin dapat mengelola artikel blog" on public.blogs;
create policy "Admin dapat mengelola artikel blog"
  on public.blogs for all
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role::text in ('admin', 'superadmin'))
  );

-- ==============================================================================
-- 11. RPC FUNCTION: PRESENSI QR & OTOMATISASI SERTIFIKAT
-- ==============================================================================
create or replace function public.record_attendance_and_claim_cert(
  p_event_id text,
  p_attendance_code text
)
returns jsonb as $$
declare
  v_user_id uuid := auth.uid();
  v_user_name text;
  v_event record;
  v_reg record;
  v_cert_id text;
  v_cert_num text;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'message', 'Pengguna belum login.');
  end if;

  -- 1. Ambil data event
  select * into v_event from public.events where id = p_event_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'Event tidak ditemukan.');
  end if;

  -- 2. Validasi kode absensi
  if upper(trim(v_event.attendance_code)) <> upper(trim(p_attendance_code)) then
    return jsonb_build_object('success', false, 'message', 'Kode presensi tidak valid.');
  end if;

  -- 3. Cek pendaftaran pengguna
  select * into v_reg from public.registrations where user_id = v_user_id and event_id = p_event_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'Anda belum terdaftar pada event ini.');
  end if;

  -- 4. Ambil nama profil
  select name into v_user_name from public.profiles where id = v_user_id;

  -- 5. Terbitkan Sertifikat jika belum ada
  v_cert_num := 'CRV-' || to_char(now(), 'YYYYMM') || '-' || upper(substr(md5(random()::text), 1, 6));
  v_cert_id := 'cert_' || substr(md5(random()::text), 1, 10);

  insert into public.certificates (
    id, certificate_number, user_id, event_id, user_name, event_title, event_date, verification_url
  ) values (
    v_cert_id,
    v_cert_num,
    v_user_id,
    p_event_id,
    coalesce(v_user_name, 'Peserta'),
    v_event.title,
    v_event.date,
    '/verify/' || v_cert_num
  )
  on conflict (user_id, event_id) do nothing;

  -- Ambil ID sertifikat yang berlaku
  select id into v_cert_id from public.certificates where user_id = v_user_id and event_id = p_event_id;

  -- 6. Update status pendaftaran menjadi attended
  update public.registrations
  set status = 'attended',
      attended_at = now(),
      certificate_id = v_cert_id
  where user_id = v_user_id and event_id = p_event_id;

  return jsonb_build_object(
    'success', true,
    'message', 'Presensi berhasil dicatat! Sertifikat Anda telah terbit.',
    'certificate_id', v_cert_id
  );
end;
$$ language plpgsql security definer;

-- ==============================================================================
-- 10. STORAGE BUCKET: crave-media (Banners, Thumbnails, Avatars)
-- ==============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'crave-media',
  'crave-media',
  true,
  5242880, -- 5 MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- RLS Storage Policies
-- 1. Public can view/download all media
drop policy if exists "Public Access to crave-media" on storage.objects;
create policy "Public Access to crave-media"
on storage.objects for select
using (bucket_id = 'crave-media');

-- 2. Allow upload to crave-media (anon & authenticated)
drop policy if exists "Allow upload to crave-media" on storage.objects;
create policy "Allow upload to crave-media"
on storage.objects for insert
with check (bucket_id = 'crave-media');

-- 3. Allow update in crave-media
drop policy if exists "Allow update to crave-media" on storage.objects;
create policy "Allow update to crave-media"
on storage.objects for update
using (bucket_id = 'crave-media');

-- 4. Allow delete from crave-media
drop policy if exists "Allow delete from crave-media" on storage.objects;
create policy "Allow delete from crave-media"
on storage.objects for delete
using (bucket_id = 'crave-media');

