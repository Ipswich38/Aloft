alter table public.orders
  add column if not exists delivery_mode text not null default 'air';

alter table public.orders
  drop constraint if exists orders_delivery_mode_check,
  add constraint orders_delivery_mode_check
  check (delivery_mode in ('air','land'));
