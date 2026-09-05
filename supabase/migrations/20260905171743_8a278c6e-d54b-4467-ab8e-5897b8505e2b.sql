insert into public.query_cache (brief_norm_hash, brief_norm, query_ir, source)
select encode(digest(btrim(regexp_replace(lower(brief), '[^a-z0-9+]+', ' ', 'g')), 'sha256'), 'hex'),
       btrim(regexp_replace(lower(brief), '[^a-z0-9+]+', ' ', 'g')),
       query_ir_json, 'golden'
from public.golden_test
where query_ir_json is not null
on conflict (brief_norm_hash) do update set query_ir = excluded.query_ir, source = 'golden';