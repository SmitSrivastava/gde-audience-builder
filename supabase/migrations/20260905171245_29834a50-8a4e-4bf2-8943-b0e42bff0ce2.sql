create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

create table if not exists public.partner (partner_name text primary key, sort_order int);
create table if not exists public.geo_tier (geo_tier text primary key, sort_order int);
create table if not exists public.age_bucket (age_bucket text primary key, age_25plus_weight numeric not null default 1, sort_order int);
create table if not exists public.gender_bucket (gender_bucket text primary key, sort_order int);
create table if not exists public.layer (layer text primary key, sort_order int, ui_blurb text);
create table if not exists public.family (family text primary key, parent text, sector text, siblings text);
create table if not exists public.synonym (token text primary key, family text not null, role text not null, weight numeric not null default 1);
create table if not exists public.modifier_op (token text primary key, op text not null, scale_param numeric, metro_tilt numeric, rule text);
create table if not exists public.dimension_token (token text primary key, dim text not null, maps_to text not null);
create table if not exists public.reliability_rule (partner text not null, when_match text not null, reliability numeric not null, note text, primary key (partner, when_match));
create table if not exists public.intra_overlap_rule (rule_id text primary key, "when" text, rho_conservative numeric, rho_expected numeric, rho_aggressive numeric, hard_note text);
create table if not exists public.family_pair_rho (family_a text not null, family_b text not null, relation text, rho_intra_expected numeric, primary key (family_a, family_b));
create table if not exists public.partner_rho (partner_a text not null, partner_b text not null, base_rho numeric, attribute_relation text not null, scale numeric, rho_same_pii numeric, rho_cross_pii numeric, primary key (partner_a, partner_b, attribute_relation));
create table if not exists public.and_intersect_rho (family_a text not null, family_b text not null, rho_and_expected numeric not null, kind text, formula text, primary key (family_a, family_b));
create table if not exists public.nesting_rule (query_token text primary key, parent_token text, kind text, action text);
create table if not exists public.partner_universe (partner_name text not null, pii text not null, universe numeric not null, primary key (partner_name, pii));
create table if not exists public.india_pop_cap (geo_tier text not null, age_bucket text not null, gender_bucket text not null, india_18plus_ceiling bigint not null, primary key (geo_tier, age_bucket, gender_bucket));
create table if not exists public.city_tier (city_name text primary key, normalized_city text, geo_tier text, zepto_user_count numeric, mapping_rule text);
create table if not exists public.hard_rule (rule_id text primary key, rule text not null);
create table if not exists public.join_op ("join" text primary key, engine text, example text);
create table if not exists public.seed_chip (chip_label text primary key, family text, modifier text);
create table if not exists public.vertex_config (key text primary key, value text);
create table if not exists public.golden_test (test_id text primary key, brief text not null, "join" text, people_reach bigint, confidence text, metro_share numeric, female_share numeric, matched_n int, partners text, primary_signal text, query_ir_json jsonb);

create table if not exists public.signal (
  master_signal_id text primary key, source_row_id int, partner_name text not null, pii text not null,
  pii_raw text, category text, sub_category text, signal text, volume numeric, row_role text,
  product_families text, sector text, layer text, reliability numeric not null default 1,
  pct_metro numeric, pct_tier1 numeric, pct_tier2 numeric, pct_tier3 numeric,
  pct_female numeric, pct_male numeric, pct_others numeric,
  pct_lt22 numeric, pct_23_28 numeric, pct_29_34 numeric, pct_35_40 numeric, pct_41_46 numeric, pct_47plus numeric,
  search_blob text
);
create index if not exists signal_blob_idx on public.signal using gin (search_blob gin_trgm_ops);
create index if not exists signal_fam_idx on public.signal (product_families);
create index if not exists signal_partner_idx on public.signal (partner_name, pii, row_role);

create table if not exists public.signal_cell (
  master_signal_id text not null, geo_tier text not null, age_bucket text not null, gender_bucket text not null,
  volume numeric not null, joint_share numeric,
  primary key (master_signal_id, geo_tier, age_bucket, gender_bucket)
);
create index if not exists signal_cell_slice_idx on public.signal_cell (geo_tier, age_bucket, gender_bucket);

create table if not exists public.query_cache (brief_norm_hash text primary key, brief_norm text not null, query_ir jsonb not null, source text not null, created_at timestamptz not null default now());
create table if not exists public.result_cache (query_ir_hash text primary key, query_ir jsonb not null, payload jsonb not null, created_at timestamptz not null default now());

create or replace function public.slice_signals(ids text[], geos text[], ages text[], genders text[], above_age int)
returns table(master_signal_id text, slice_volume numeric)
language sql stable
set search_path = public
as $$
  select c.master_signal_id,
         sum(c.volume * case
           when above_age is null then 1
           when c.age_bucket = 'Less than 22' then 0
           when c.age_bucket = '23-28' and above_age <= 25 then 0.5
           else 1
         end) as slice_volume
  from public.signal_cell c
  where c.master_signal_id = any (ids)
    and (geos is null or cardinality(geos)=0 or c.geo_tier = any (geos))
    and (ages is null or cardinality(ages)=0 or c.age_bucket = any (ages))
    and (genders is null or cardinality(genders)=0 or c.gender_bucket = any (genders))
  group by c.master_signal_id;
$$;

do $$
declare t text;
begin
  foreach t in array array['partner','geo_tier','age_bucket','gender_bucket','layer','family','synonym','modifier_op','dimension_token','reliability_rule','intra_overlap_rule','family_pair_rho','partner_rho','and_intersect_rho','nesting_rule','partner_universe','india_pop_cap','city_tier','hard_rule','join_op','seed_chip','vertex_config','golden_test','signal','signal_cell']
  loop
    execute format('grant select, insert, update, delete on public.%I to anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "public read %s" on public.%I', t, t);
    execute format('create policy "public read %s" on public.%I for select using (true)', t, t);
    execute format('drop policy if exists "public load %s" on public.%I', t, t);
    execute format('create policy "public load %s" on public.%I for insert with check (true)', t, t);
    execute format('drop policy if exists "public clear %s" on public.%I', t, t);
    execute format('create policy "public clear %s" on public.%I for delete using (true)', t, t);
    execute format('drop policy if exists "public update %s" on public.%I', t, t);
    execute format('create policy "public update %s" on public.%I for update using (true) with check (true)', t, t);
  end loop;
end $$;

grant all on public.query_cache to service_role;
grant all on public.result_cache to service_role;
alter table public.query_cache enable row level security;
alter table public.result_cache enable row level security;