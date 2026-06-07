alter table public.drones
  add column if not exists tail_number text,
  add column if not exists registration_expiry date;

update public.drones
set tail_number = coalesce(tail_number, name, serial_number, id::text)
where tail_number is null;

alter table public.drones
  alter column tail_number set not null;

create unique index if not exists drones_tail_number_key
  on public.drones (tail_number);
