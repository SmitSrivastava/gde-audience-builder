create or replace function public.set_signal_embeddings(payload jsonb)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  with data as (
    select (e->>'id')::text as id, (e->>'v')::vector(768) as v
    from jsonb_array_elements(payload) e
  )
  update public.signal s set embedding = d.v
  from data d where s.master_signal_id = d.id;
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke execute on function public.set_signal_embeddings(jsonb) from public, anon, authenticated;
grant execute on function public.set_signal_embeddings(jsonb) to service_role;