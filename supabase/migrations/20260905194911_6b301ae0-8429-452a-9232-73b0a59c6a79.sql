create extension if not exists vector;

alter table public.signal
  add column if not exists platform_tags text,
  add column if not exists embedding vector(768);

create index if not exists signal_embedding_hnsw
  on public.signal using hnsw (embedding vector_cosine_ops);

create index if not exists signal_platform_tags_idx on public.signal (platform_tags);

create or replace function public.match_signals(
  query_embedding vector(768),
  match_count int default 40,
  min_sim float default 0.55
)
returns table (
  master_signal_id text,
  partner_name text,
  pii text,
  signal text,
  product_families text,
  platform_tags text,
  row_role text,
  layer text,
  sector text,
  category text,
  sub_category text,
  volume numeric,
  reliability numeric,
  sim float
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.master_signal_id, s.partner_name, s.pii, s.signal, s.product_families,
    s.platform_tags, s.row_role, s.layer, s.sector, s.category, s.sub_category,
    s.volume, s.reliability,
    (1 - (s.embedding <=> query_embedding))::float as sim
  from public.signal s
  where s.row_role = 'intent'
    and s.reliability > 0
    and s.embedding is not null
    and (1 - (s.embedding <=> query_embedding)) >= min_sim
  order by s.embedding <=> query_embedding
  limit match_count;
$$;

grant execute on function public.match_signals(vector, int, float) to anon, authenticated, service_role;