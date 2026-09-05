// Backfills signal.embedding with Vertex text-embedding-004 (768 dims).
// Call repeatedly with { limit } until { remaining: 0 }.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { CORS, embed } from "../_shared/vertex.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  try {
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Number(body.limit) || 200, 400);

    const { count: remainingBefore } = await sb.from("signal")
      .select("master_signal_id", { count: "exact", head: true })
      .is("embedding", null);

    const { data: rows, error } = await sb.from("signal")
      .select("master_signal_id, partner_name, platform_tags, category, sub_category, signal, product_families, sector, layer")
      .is("embedding", null)
      .limit(limit);
    if (error) throw error;
    if (!rows?.length) {
      return new Response(JSON.stringify({ done: true, embedded: 0, remaining: 0 }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const docs = rows.map((r: any) =>
      [r.partner_name, r.platform_tags, r.category, r.sub_category, r.signal, r.product_families, r.sector, r.layer]
        .filter(Boolean).join(" ")
    );
    const vecs = await embed(docs, "RETRIEVAL_DOCUMENT");

    let ok = 0;
    for (let i = 0; i < rows.length; i++) {
      const v = vecs[i];
      if (!v) continue;
      const { error: uerr } = await sb.from("signal")
        .update({ embedding: JSON.stringify(v) })
        .eq("master_signal_id", (rows[i] as any).master_signal_id);
      if (!uerr) ok++;
    }

    const remaining = Math.max(0, (remainingBefore ?? rows.length) - ok);
    return new Response(JSON.stringify({ done: remaining === 0, embedded: ok, remaining }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("embed-catalog failed", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
