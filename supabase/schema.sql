-- ============================================================================
-- Aloft — Philippine drone delivery platform
-- Compliance-first schema for Supabase (Postgres + RLS)
-- Apply in the Supabase SQL editor or: supabase db push
-- ============================================================================

-- Extensions ----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Enums ---------------------------------------------------------------------
do $$ begin
  create type app_role as enum ('customer', 'merchant', 'operator');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum
    ('draft','submitted','accepted','scheduled','in_flight','delivered','cancelled','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type flight_status as enum
    ('planned','compliance_blocked','cleared','dispatched','airborne','completed','aborted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type flycart_model as enum ('FC30','FC100');
exception when duplicate_object then null; end $$;

do $$ begin
  create type drop_method as enum ('locker','winch','pad');
exception when duplicate_object then null; end $$;

-- Profiles (1:1 with auth.users) --------------------------------------------
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        app_role not null default 'customer',
  phone       text,
  org_name    text,                       -- for merchants / operators
  created_at  timestamptz not null default now()
);

-- Helper: current user's role (security definer to avoid RLS recursion) ------
create or replace function current_role_of(uid uuid)
returns app_role language sql stable security definer set search_path = public as $$
  select role from profiles where id = uid;
$$;

-- Drop sites (pickup / delivery points: clinics, barangay halls, hubs) -------
create table if not exists drop_sites (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  municipality  text,
  province      text,
  lat           double precision not null,
  lng           double precision not null,
  method        drop_method not null default 'pad',
  created_at    timestamptz not null default now()
);

-- Fleet: drones --------------------------------------------------------------
create table if not exists drones (
  id                  uuid primary key default gen_random_uuid(),
  model               flycart_model not null,
  tail_number         text unique not null,
  caap_registration   text,
  registration_expiry date,
  status              text not null default 'active'
                      check (status in ('active','maintenance','grounded')),
  created_at          timestamptz not null default now()
);

-- Pilots (RPL holders) -------------------------------------------------------
create table if not exists pilots (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  rpl_number  text,
  rpl_expiry  date,
  created_at  timestamptz not null default now()
);

-- Operator-level certs: ROC + insurance -------------------------------------
create table if not exists operator_credentials (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('operator_roc','insurance')),
  reference     text not null,
  valid_until   date,
  created_at    timestamptz not null default now()
);

-- BVLOS corridors with their CAAP special permits ---------------------------
create table if not exists corridors (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  origin_site_id        uuid references drop_sites(id),
  dest_site_id          uuid references drop_sites(id),
  distance_km           double precision not null,
  is_bvlos              boolean not null default true,
  special_permit_number text,
  permit_expiry         date,
  nearest_airport_km    double precision not null default 50,
  created_at            timestamptz not null default now()
);

-- Orders ---------------------------------------------------------------------
create table if not exists orders (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid not null references auth.users(id),
  merchant_id       uuid references auth.users(id),
  origin_site_id    uuid references drop_sites(id),
  dest_site_id      uuid references drop_sites(id),
  category          text check (category in ('food','groceries','parcel','medicine')),
  cargo_description text not null,
  weight_kg         numeric(6,2) not null check (weight_kg > 0),
  priority          boolean not null default false,
  delivery_mode     text not null default 'air'
                    check (delivery_mode in ('air','land')),
  status            order_status not null default 'submitted',
  flight_id         uuid,
  price_centavos    integer,
  created_at        timestamptz not null default now()
);

alter table orders
  add column if not exists delivery_mode text not null default 'air';

alter table orders
  drop constraint if exists orders_delivery_mode_check,
  add constraint orders_delivery_mode_check
  check (delivery_mode in ('air','land'));

-- Flights (a dispatched mission carrying one or more orders) -----------------
create table if not exists flights (
  id              uuid primary key default gen_random_uuid(),
  corridor_id     uuid references corridors(id),
  drone_id        uuid references drones(id),
  pilot_id        uuid references pilots(id),
  status          flight_status not null default 'planned',
  planned_alt_m   integer not null default 100,
  scheduled_for   timestamptz,
  -- DeliveryHub handoff trail
  deliveryhub_job_id text,
  dispatched_at   timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz not null default now()
);

alter table orders
  drop constraint if exists orders_flight_id_fkey,
  add constraint orders_flight_id_fkey
  foreign key (flight_id) references flights(id) on delete set null;

-- Immutable audit log (compliance evidence) ---------------------------------
create table if not exists audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references auth.users(id),
  entity      text not null,            -- 'order' | 'flight' | 'drone' ...
  entity_id   uuid,
  action      text not null,            -- 'created' | 'status_change' | 'compliance_check' ...
  detail      jsonb,
  created_at  timestamptz not null default now()
);

-- Row Level Security ---------------------------------------------------------
alter table profiles             enable row level security;
alter table orders               enable row level security;
alter table drop_sites           enable row level security;
alter table drones               enable row level security;
alter table pilots               enable row level security;
alter table operator_credentials enable row level security;
alter table corridors            enable row level security;
alter table flights              enable row level security;
alter table audit_log            enable row level security;

-- profiles: a user sees/edits their own; operators see all
drop policy if exists profiles_self on profiles;
create policy profiles_self on profiles
  for all using (id = auth.uid() or current_role_of(auth.uid()) = 'operator')
  with check (id = auth.uid() or current_role_of(auth.uid()) = 'operator');

-- drop_sites & corridors: readable by any authenticated user; operators manage
drop policy if exists drop_sites_read on drop_sites;
create policy drop_sites_read on drop_sites for select using (auth.role() = 'authenticated');
drop policy if exists drop_sites_write on drop_sites;
create policy drop_sites_write on drop_sites for all
  using (current_role_of(auth.uid()) = 'operator')
  with check (current_role_of(auth.uid()) = 'operator');

drop policy if exists corridors_read on corridors;
create policy corridors_read on corridors for select using (auth.role() = 'authenticated');
drop policy if exists corridors_write on corridors;
create policy corridors_write on corridors for all
  using (current_role_of(auth.uid()) = 'operator')
  with check (current_role_of(auth.uid()) = 'operator');

-- orders: customer sees own; merchant sees assigned/unassigned; operator sees all
drop policy if exists orders_select on orders;
create policy orders_select on orders for select using (
  customer_id = auth.uid()
  or current_role_of(auth.uid()) in ('merchant','operator')
);
drop policy if exists orders_insert on orders;
create policy orders_insert on orders for insert with check (customer_id = auth.uid());
drop policy if exists orders_update on orders;
create policy orders_update on orders for update using (
  customer_id = auth.uid()
  or current_role_of(auth.uid()) in ('merchant','operator')
);

-- fleet/compliance tables: operator only (merchants can read fleet for dispatch)
drop policy if exists drones_ops on drones;
create policy drones_ops on drones for all
  using (current_role_of(auth.uid()) in ('operator','merchant'))
  with check (current_role_of(auth.uid()) = 'operator');

drop policy if exists pilots_ops on pilots;
create policy pilots_ops on pilots for all
  using (current_role_of(auth.uid()) = 'operator')
  with check (current_role_of(auth.uid()) = 'operator');

drop policy if exists opcred_ops on operator_credentials;
create policy opcred_ops on operator_credentials for all
  using (current_role_of(auth.uid()) = 'operator')
  with check (current_role_of(auth.uid()) = 'operator');

drop policy if exists flights_ops on flights;
create policy flights_ops on flights for all
  using (current_role_of(auth.uid()) in ('operator','merchant'))
  with check (current_role_of(auth.uid()) in ('operator','merchant'));

-- audit_log: append-only; operators read, anyone authenticated inserts
drop policy if exists audit_insert on audit_log;
create policy audit_insert on audit_log for insert with check (auth.role() = 'authenticated');
drop policy if exists audit_read on audit_log;
create policy audit_read on audit_log for select using (current_role_of(auth.uid()) = 'operator');

-- Auto-create a profile when a user signs up --------------------------------
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::app_role, 'customer')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
