-- Demo seed for Aloft (island/rural last-mile scenario).
-- Run AFTER schema.sql. Safe to re-run.

insert into drop_sites (id, name, municipality, province, lat, lng, method) values
  ('11111111-1111-1111-1111-111111111111','Tagbilaran Hub','Tagbilaran City','Bohol',9.6496,123.8556,'pad'),
  ('22222222-2222-2222-2222-222222222222','Ubay Rural Health Unit','Ubay','Bohol',10.0556,124.4731,'winch'),
  ('33333333-3333-3333-3333-333333333333','Talibon District Hospital','Talibon','Bohol',10.1496,124.3219,'pad'),
  ('44444444-4444-4444-4444-444444444444','Pres. Carlos P. Garcia Locker','Pitogo','Bohol',10.0469,124.5781,'locker')
on conflict (id) do nothing;

insert into drones (id, name, model, serial_number, tail_number, caap_registration, registration_expiry, status) values
  ('aaaa1111-0000-0000-0000-000000000001','Aloft FlyCart 01','FC30','ALOFT-01','ALOFT-01','RPAS-2026-0451','2027-03-31','active'),
  ('aaaa1111-0000-0000-0000-000000000002','Aloft FlyCart 02','FC30','ALOFT-02','ALOFT-02','RPAS-2026-0452','2027-03-31','active'),
  ('aaaa1111-0000-0000-0000-000000000003','Aloft FlyCart 03','FC100','ALOFT-03','ALOFT-03',null,null,'maintenance')
on conflict (id) do nothing;

insert into pilots (id, full_name, rpl_number, rpl_expiry) values
  ('bbbb2222-0000-0000-0000-000000000001','Maria Santos','RPL-PH-018221','2027-08-15'),
  ('bbbb2222-0000-0000-0000-000000000002','Jose Dela Cruz','RPL-PH-018990','2026-11-30')
on conflict (id) do nothing;

insert into operator_credentials (kind, reference, valid_until) values
  ('operator_roc','ROC-2026-ALOFT-PH','2027-01-31'),
  ('insurance','TPL-MAPFRE-99812','2026-12-31')
on conflict do nothing;

insert into corridors (id, name, origin_site_id, dest_site_id, distance_km, is_bvlos, special_permit_number, permit_expiry, nearest_airport_km) values
  ('cccc3333-0000-0000-0000-000000000001','Tagbilaran → Ubay',
     '11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',
     14.0,true,'SFP-2026-BHL-002','2026-12-31',22),
  ('cccc3333-0000-0000-0000-000000000002','Tagbilaran → Talibon',
     '11111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333',
     11.5,true,null,null,30)
on conflict (id) do nothing;
