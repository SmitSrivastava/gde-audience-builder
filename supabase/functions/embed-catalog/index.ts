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

    // Embed in parallel chunks, then write everything in one bulk RPC.
    const chunkSize = 20;
    const chunks: { start: number; texts: string[] }[] = [];
    for (let i = 0; i < docs.length; i += chunkSize) chunks.push({ start: i, texts: docs.slice(i, i + chunkSize) });
    const vecs: number[][] = new Array(docs.length);
    for (let i = 0; i < chunks.length; i += 6) {
      const group = chunks.slice(i, i + 6);
      const res = await Promise.all(group.map((c) => embed(c.texts, "RETRIEVAL_DOCUMENT")));
      res.forEach((vs, gi) => vs.forEach((v, vi) => { vecs[group[gi].start + vi] = v; }));
    }

    const payload = rows
      .map((r: any, i: number) => (vecs[i] ? { id: r.master_signal_id, v: JSON.stringify(vecs[i]) } : null))
      .filter(Boolean);
    const { data: written, error: werr } = await sb.rpc("set_signal_embeddings", { payload });
    if (werr) throw werr;
    const ok = Number(written) || 0;


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
