// Supabase Edge Function: plan-audience
// Input: { brief: string } OR { query_ir: object }
// All rho, reliability, caps, synonyms come FROM TABLES.
// Same QueryIR hash always returns the cached payload.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normBrief(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9+]+/g, " ").replace(/\s+/g, " ").trim();
}
async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function stable(obj: unknown) {
  return JSON.stringify(obj);
}

type IR = {
  join: "AND" | "OR";
  anchors: { canonical: string; family: string; role: string; tokens: string[] }[];
  modifiers: { token: string; op: string; param?: number | null }[];
  dimensions: {
    geo_tier: string[];
    age_bucket: string[];
    gender_bucket: string[];
    city: string | null;
    above_age: number | null;
  };
  mode: "conservative" | "expected" | "aggressive";
  refuse: { flag: boolean; reason: string | null };
};

function modeCol(mode: IR["mode"]) {
  if (mode === "conservative") return "rho_conservative";
  if (mode === "aggressive") return "rho_aggressive";
  return "rho_expected";
}

const AGE_ORDER = ["Less than 22", "23-28", "29-34", "35-40", "41-46", "47+"];

/* ---------- Pass 1: deterministic, table-driven brief compiler ---------- */
async function pass1(sb: SupabaseClient, brief: string): Promise<IR | null> {
  const n = normBrief(brief);
  const [{ data: syns }, { data: mods }, { data: dims }, { data: cities }] = await Promise.all([
    sb.from("synonym").select("token, family, role, weight"),
    sb.from("modifier_op").select("token, op, scale_param"),
    sb.from("dimension_token").select("token, dim, maps_to"),
    sb.from("city_tier").select("city_name, normalized_city, geo_tier"),
  ]);

  const has = (t: string) => new RegExp(`(^| )${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( |$)`).test(n);

  const anchors: IR["anchors"] = [];
  const seenFam = new Set<string>();
  for (const s of (syns || []).filter((x: any) => x.role === "anchor")
    .sort((a: any, b: any) => String(b.token).length - String(a.token).length)) {
    const tok = String(s.token).toLowerCase();
    if (!has(tok)) continue;
    if (seenFam.has(s.family)) {
      const a = anchors.find((x) => x.family === s.family)!;
      if (!a.tokens.includes(tok)) a.tokens.push(tok);
      continue;
    }
    seenFam.add(s.family);
    anchors.push({ canonical: tok, family: String(s.family).toLowerCase(), role: anchors.length ? "and" : "primary", tokens: [tok] });
  }
  if (!anchors.length) return null;

  const modifiers: IR["modifiers"] = [];
  for (const m of mods || []) {
    const tok = String(m.token).toLowerCase();
    if (has(tok)) modifiers.push({ token: tok, op: m.op, param: m.scale_param ?? null });
  }

  const dimensions: IR["dimensions"] = { geo_tier: [], age_bucket: [], gender_bucket: [], city: null, above_age: null };
  const push = (arr: string[], v: string) => { if (v && !arr.includes(v)) arr.push(v); };
  for (const d of dims || []) {
    const tok = String(d.token).toLowerCase();
    if (!has(tok)) continue;
    const dim = String(d.dim).toLowerCase();
    const targets = String(d.maps_to).split(/[,|]/).map((x) => x.trim()).filter(Boolean);
    if (dim.startsWith("geo")) targets.forEach((t) => push(dimensions.geo_tier, t));
    else if (dim.startsWith("gender")) targets.forEach((t) => push(dimensions.gender_bucket, t));
    else if (dim.startsWith("age")) targets.forEach((t) => push(dimensions.age_bucket, t));
    else if (dim.startsWith("above")) {
      const v = Number(targets[0]);
      if (!Number.isNaN(v)) dimensions.above_age = v;
    }
  }
  const above = n.match(/(?:above|over|older than)\s+(\d{2})/) || n.match(/(\d{2})\s*\+/);
  const ageNum = above ? Number(above[1]) : NaN;
  if (!Number.isNaN(ageNum) && ageNum >= 18 && ageNum <= 60) dimensions.above_age = ageNum;
  if (dimensions.above_age != null) dimensions.age_bucket = AGE_ORDER.slice(1);

  for (const c of cities || []) {
    const key = String(c.normalized_city || c.city_name || "").toLowerCase();
    if (key && has(key)) { dimensions.city = String(c.city_name); break; }
  }

  const joinAnd = / and | plus | who also | along with /.test(` ${n} `) && anchors.length >= 2;
  return {
    join: joinAnd ? "AND" : "OR",
    anchors: anchors.map((a) => ({ ...a, tokens: a.tokens.sort() })).sort((a, b) => a.canonical.localeCompare(b.canonical)),
    modifiers: modifiers.sort((a, b) => a.token.localeCompare(b.token)),
    dimensions,
    mode: "expected",
    refuse: { flag: false, reason: null },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  try {
    const body = await req.json();
    let ir: IR | null = body.query_ir ?? null;
    const brief: string = body.brief ?? "";
    let source = ir ? "client" : "";

    if (!ir && brief) {
      const n = normBrief(brief);
      const h = await sha256(n);
      const hit = await sb.from("query_cache").select("query_ir, source").eq("brief_norm_hash", h).maybeSingle();
      if (hit.data?.query_ir) {
        ir = hit.data.query_ir as IR;
        source = hit.data.source;
      } else {
        // Pass 1 first (free + deterministic), Vertex only when Pass 1 cannot resolve an anchor.
        const p1 = await pass1(sb, brief);
        if (p1) {
          ir = p1;
          source = "pass1";
          await sb.from("query_cache").upsert({ brief_norm_hash: h, brief_norm: n, query_ir: p1, source: "pass1" });
        } else {
          const vr = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/vertex-parse`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({ brief }),
          });
          const vj = await vr.json().catch(() => ({}));
          if (vj?.query_ir) {
            ir = vj.query_ir as IR;
            source = vj.source || "vertex";
          } else {
            return new Response(
              JSON.stringify({
                refuse: { flag: true, reason: "No known audience family found in this brief. Try a product or category noun, e.g. skincare, SUV, chocolate." },
                people_reach: 0,
                source: "refuse",
              }),
              { headers: { ...CORS, "Content-Type": "application/json" } },
            );
          }
        }
      }
    }
    if (!ir) {
      return new Response(JSON.stringify({ error: "brief or query_ir required" }), { status: 400, headers: CORS });
    }
    if (ir.refuse?.flag) {
      return new Response(JSON.stringify({ refuse: ir.refuse, people_reach: 0, query_ir: ir, source }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const irHash = await sha256(stable(ir));
    const cached = await sb.from("result_cache").select("payload").eq("query_ir_hash", irHash).maybeSingle();
    if (cached.data?.payload) {
      return new Response(JSON.stringify({ ...cached.data.payload, source, cached: true }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const payload = await plan(sb, ir);
    await sb.from("result_cache").upsert({ query_ir_hash: irHash, query_ir: ir, payload });
    return new Response(JSON.stringify({ ...payload, source, cached: false }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("plan-audience failed", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});

async function plan(sb: SupabaseClient, ir: IR) {
  // City → geo_tier (R9). If city set, it OVERRIDES empty geo_tier.
  let geos = ir.dimensions.geo_tier || [];
  if (ir.dimensions.city) {
    const { data } = await sb.from("city_tier").select("geo_tier, city_name, normalized_city");
    const key = ir.dimensions.city.toLowerCase();
    const hit = (data || []).find((c: any) =>
      c.city_name?.toLowerCase() === key || c.normalized_city?.toLowerCase() === key
    );
    if (hit?.geo_tier) geos = [hit.geo_tier];
  }
  const genders = ir.dimensions.gender_bucket || [];
  const ages = ir.dimensions.age_bucket || [];
  const above = ir.dimensions.above_age;
  const preferTokens = (ir.modifiers || [])
    .filter((m) => m.op === "PREFER_ROW_ELSE_SCALE")
    .map((m) => m.token.toLowerCase());

  const anchorPeople: { family: string; reach: number; rows: any[]; ids: string[] }[] = [];
  for (const a of ir.anchors) {
    const rows = await retrieve(sb, a.family, a.tokens, preferTokens, a.canonical);
    const ids = rows.map((r) => r.master_signal_id);
    const sliced = await slice(sb, ids, geos, ages, genders, above);
    const volMap: Record<string, number> = {};
    for (const s of sliced) volMap[s.master_signal_id] = Number(s.slice_volume);
    const reach = await unionTableDriven(sb, rows, volMap, ir.mode);
    anchorPeople.push({ family: a.family, reach, rows, ids });
  }

  let people = 0;
  if (ir.join === "AND" && anchorPeople.length >= 2) {
    people = await andBlend(sb, anchorPeople[0], anchorPeople[1], geos, ages, genders, above);
  } else {
    people = anchorPeople[0]?.reach ?? 0;
    for (let i = 1; i < anchorPeople.length; i++) {
      people = people + anchorPeople[i].reach * (1 - 0.16);
    }
  }

  const allRows = anchorPeople.flatMap((a) => a.rows);
  const allIds = anchorPeople.flatMap((a) => a.ids);
  const mix = await mixOf(sb, allIds, geos, ages, genders, above, ir.join, anchorPeople);

  const cap = await indiaCap(sb, mix.geo, mix.age, mix.gen, genders, above);
  const peopleCapped = Math.min(people, cap || people);

  const primary = pickPrimary(anchorPeople[0]?.rows || []);
  const expansion = pickPrimary(anchorPeople[1]?.rows || anchorPeople[0]?.rows?.slice(1) || []);
  const precision = pickPrecision(allRows);

  const matched = allRows
    .sort((a, b) => Number(b.volume) - Number(a.volume))
    .slice(0, 12)
    .map((r) => ({
      audience_signal: r.signal,
      sector: r.sector,
      layer: r.layer,
      partner_sources: r.partner_name,
      scale: Math.round(Number(r.volume) * Number(r.reliability)),
      master_signal_id: r.master_signal_id,
    }));

  const geoSplit = Object.entries(mix.geo).map(([k, sh]) => ({
    geo_tier: k, volume: Math.round(peopleCapped * sh), share: round4(sh),
  }));
  const ageSplit = Object.entries(mix.age).map(([k, sh]) => ({
    age_bucket: k, volume: Math.round(peopleCapped * sh), share: round4(sh),
  }));
  const genderSplit = Object.entries(mix.gen).map(([k, sh]) => ({
    gender_bucket: k, volume: Math.round(peopleCapped * sh), share: round4(sh),
  }));

  return {
    query_ir: ir,
    people_reach: Math.round(peopleCapped),
    identifier_reach: Math.round(peopleCapped),
    planning_confidence: (allRows.some((r) => Number(r.reliability) >= 0.7) ? "High" : "Medium"),
    matched_signals: matched,
    primary_audience: primary,
    expansion_audience: expansion,
    precision_audience: precision,
    geo_split: geoSplit,
    age_split: ageSplit,
    gender_split: genderSplit,
    partners: [...new Set(allRows.map((r) => r.partner_name))],
    how_built: {
      join: ir.join,
      anchors: ir.anchors.map((a) => a.family),
      modifiers: ir.modifiers,
      rules: ["R9 demo slice first", "R16 prefer modified row", "R17 reliability", "R3 nest", "R4-R7 union from tables", ir.join === "AND" ? "R21 Frechet AND" : "OR union"],
      cached_forever: true,
    },
  };
}

async function retrieve(sb: SupabaseClient, family: string, tokens: string[], prefer: string[], canonical: string) {
  const { data, error } = await sb.from("signal")
    .select("*")
    .eq("row_role", "intent")
    .gt("reliability", 0)
    .ilike("product_families", `%${family}%`)
    .limit(2000);
  if (error) throw error;
  let rows = (data || []).filter((r) =>
    (r.product_families || "").split(",").map((s: string) => s.trim()).includes(family)
  );
  const squash = (s: string) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const blobHit = [...tokens, canonical].filter(Boolean).map(squash);
  const tokHit = rows.filter((r) => blobHit.some((t) => squash(r.search_blob).includes(t)));
  if (tokHit.length) rows = tokHit;
  if (prefer.length) {
    const p = prefer.map(squash);
    const pref = rows.filter((r) => p.some((t) => squash(r.search_blob).includes(t)));
    if (pref.length) rows = pref; // R16
  }

  return rows;
}

async function slice(sb: SupabaseClient, ids: string[], geos: string[], ages: string[], genders: string[], above: number | null) {
  if (!ids.length) return [];
  const out: any[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await sb.rpc("slice_signals", {
      ids: ids.slice(i, i + 200),
      geos: geos.length ? geos : null,
      ages: ages.length ? ages : null,
      genders: genders.length ? genders : null,
      above_age: above,
    });
    if (error) throw error;
    out.push(...(data || []));
  }
  return out;
}

async function unionTableDriven(sb: SupabaseClient, rows: any[], volMap: Record<string, number>, mode: IR["mode"]) {
  const { data: intra } = await sb.from("intra_overlap_rule").select("*");
  const rhoOf = (id: string) => {
    const r = (intra || []).find((x: any) => x.rule_id === id);
    return r ? Number(r[modeCol(mode)]) : 0.14;
  };
  const { data: pr } = await sb.from("partner_rho").select("*");
  const { data: uni } = await sb.from("partner_universe").select("*");

  type It = { partner: string; pii: string; families: string[]; vol: number; name: string };
  const items: It[] = [];
  for (const r of rows) {
    const vol = (volMap[r.master_signal_id] || 0) * Number(r.reliability || 1); // R17
    if (vol <= 0) continue;
    items.push({
      partner: r.partner_name, pii: r.pii,
      families: String(r.product_families || "").split(",").map((s: string) => s.trim()).filter(Boolean),
      vol, name: String(r.signal || "").toLowerCase(),
    });
  }
  const groups = new Map<string, It[]>();
  for (const it of items) {
    const k = `${it.partner}::${it.pii}`;
    groups.set(k, [...(groups.get(k) || []), it]);
  }
  const nodes: { partner: string; pii: string; people: number; families: Set<string> }[] = [];
  for (const [k, lst0] of groups) {
    const lst = [...lst0].sort((a, b) => b.vol - a.vol); // R20
    let u = lst[0].vol;
    const accF = new Set(lst[0].families);
    const accN = lst[0].name;
    for (const cur of lst.slice(1)) {
      const nested = (cur.name.length > 6 && accN.includes(cur.name)) || (accN.length > 6 && cur.name.includes(accN));
      if (nested) continue; // R3
      const same = cur.families.some((f) => accF.has(f));
      const rho = same ? rhoOf("R4_SAME_FAMILY") : Math.max(0.08, rhoOf("R6_DISTANT"));
      u += cur.vol * (1 - Math.min(0.95, rho));
      cur.families.forEach((f) => accF.add(f));
    }
    const [partner, pii] = k.split("::");
    const cap = (uni || []).find((x: any) => x.partner_name === partner && x.pii === pii);
    if (cap) u = Math.min(u, Number(cap.universe));
    u = Math.min(u, lst.reduce((s, x) => s + x.vol, 0));
    nodes.push({ partner, pii, people: u, families: accF });
  }
  // R14 same partner cross pii
  const byP = new Map<string, typeof nodes>();
  for (const n of nodes) {
    byP.set(n.partner, [...(byP.get(n.partner) || []), n]);
  }
  const peopleNodes: { partner: string; people: number; families: Set<string> }[] = [];
  const link = rhoOf("R14_CROSS_PII");
  for (const [partner, arr] of byP) {
    const ph = arr.find((x) => x.pii === "phone" || x.pii === "Phone Number");
    const dv = arr.find((x) => x !== ph);
    const fams = new Set<string>();
    arr.forEach((x) => x.families.forEach((f) => fams.add(f)));
    let people = 0;
    if (ph && dv) {
      const mx = Math.max(ph.people, dv.people), mn = Math.min(ph.people, dv.people);
      people = mx + mn * (1 - link);
    } else {
      people = (ph || dv || arr[0]).people;
    }
    peopleNodes.push({ partner, people, families: fams });
  }
  peopleNodes.sort((a, b) => b.people - a.people);
  if (!peopleNodes.length) return 0;
  let reach = peopleNodes[0].people;
  const accF = new Set(peopleNodes[0].families);
  const accP = peopleNodes[0].partner;
  for (const n of peopleNodes.slice(1)) {
    const same = [...n.families].some((f) => accF.has(f));
    const rel = same ? "same_family" : "distant_family";
    const rec = (pr || []).find((x: any) =>
      ((x.partner_a === accP && x.partner_b === n.partner) || (x.partner_b === accP && x.partner_a === n.partner)) &&
      x.attribute_relation === rel
    );
    const rho = rec ? Number(rec.rho_same_pii) : 0.10;
    reach += n.people * (1 - Math.min(0.85, Math.max(0.02, rho)));
    n.families.forEach((f) => accF.add(f));
  }
  return reach;
}

async function andBlend(
  sb: SupabaseClient,
  A: { family: string; reach: number },
  B: { family: string; reach: number },
  geos: string[], ages: string[], genders: string[], above: number | null,
) {
  const { data } = await sb.from("and_intersect_rho").select("*")
    .or(`and(family_a.eq.${A.family},family_b.eq.${B.family}),and(family_a.eq.${B.family},family_b.eq.${A.family})`);
  const rho = data?.[0] ? Number(data[0].rho_and_expected) : 0.10;
  const { data: caps } = await sb.from("india_pop_cap").select("*");
  let pop = 0;
  for (const c of caps || []) {
    if (geos.length && !geos.includes(c.geo_tier)) continue;
    if (ages.length && !ages.includes(c.age_bucket)) continue;
    if (genders.length && !genders.includes(c.gender_bucket)) continue;
    let w = 1;
    if (above != null) {
      if (c.age_bucket === "Less than 22") w = 0;
      else if (c.age_bucket === "23-28") w = 0.5;
    }
    pop += Number(c.india_18plus_ceiling) * w;
  }
  const lower = Math.max(0, A.reach + B.reach - (pop || 9.5e8));
  const upper = Math.min(A.reach, B.reach);
  return lower + rho * (upper - lower); // R21
}

async function mixOf(
  sb: SupabaseClient, ids: string[], geos: string[], ages: string[], genders: string[],
  above: number | null, join: string, anchors: { ids: string[] }[],
) {
  const load = async (idset: string[]) => {
    const geo: Record<string, number> = {}, age: Record<string, number> = {}, gen: Record<string, number> = {};
    for (let i = 0; i < idset.length; i += 200) {
      const { data } = await sb.from("signal_cell")
        .select("geo_tier, age_bucket, gender_bucket, volume")
        .in("master_signal_id", idset.slice(i, i + 200))
        .limit(50000);
      for (const r of data || []) {
        if (geos.length && !geos.includes(r.geo_tier)) continue;
        if (ages.length && !ages.includes(r.age_bucket)) continue;
        if (genders.length && !genders.includes(r.gender_bucket)) continue;
        let w = 1;
        if (above != null) {
          if (r.age_bucket === "Less than 22") w = 0;
          else if (r.age_bucket === "23-28") w = 0.5;
        }
        const v = Number(r.volume) * w;
        geo[r.geo_tier] = (geo[r.geo_tier] || 0) + v;
        age[r.age_bucket] = (age[r.age_bucket] || 0) + v;
        gen[r.gender_bucket] = (gen[r.gender_bucket] || 0) + v;
      }
    }
    const n = (d: Record<string, number>) => {
      const s = Object.values(d).reduce((a, b) => a + b, 0) || 1;
      return Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v / s]));
    };
    return { geo: n(geo), age: n(age), gen: n(gen) };
  };
  if (join === "AND" && anchors.length >= 2) {
    const A = await load(anchors[0].ids);
    const B = await load(anchors[1].ids);
    const { data: pop } = await sb.from("india_pop_cap").select("*");
    const popGeo: Record<string, number> = {}, popAge: Record<string, number> = {}, popGen: Record<string, number> = {};
    for (const c of pop || []) {
      popGeo[c.geo_tier] = (popGeo[c.geo_tier] || 0) + Number(c.india_18plus_ceiling);
      popAge[c.age_bucket] = (popAge[c.age_bucket] || 0) + Number(c.india_18plus_ceiling);
      popGen[c.gender_bucket] = (popGen[c.gender_bucket] || 0) + Number(c.india_18plus_ceiling);
    }
    const blend = (a: Record<string, number>, b: Record<string, number>, p: Record<string, number>) => {
      const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
      const out: Record<string, number> = {};
      for (const k of keys) out[k] = ((a[k] || 0) * (b[k] || 0)) / Math.max(1, p[k] || 1);
      const s = Object.values(out).reduce((x, y) => x + y, 0) || 1;
      return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v / s]));
    };
    return { geo: blend(A.geo, B.geo, popGeo), age: blend(A.age, B.age, popAge), gen: blend(A.gen, B.gen, popGen) };
  }
  return load(ids);
}

async function indiaCap(sb: SupabaseClient, geo: Record<string, number>, age: Record<string, number>, gen: Record<string, number>, genders: string[], above: number | null) {
  const { data } = await sb.from("india_pop_cap").select("*");
  let cap = 0;
  for (const c of data || []) {
    if (genders.length && !genders.includes(c.gender_bucket)) continue;
    let w = 1;
    if (above != null) {
      if (c.age_bucket === "Less than 22") w = 0;
      else if (c.age_bucket === "23-28") w = 0.5;
    }
    cap += Number(c.india_18plus_ceiling) * w * (geo[c.geo_tier] || 0) * (age[c.age_bucket] || 0) * (gen[c.gender_bucket] || 0);
  }
  let raw = 0;
  for (const c of data || []) {
    if (genders.length && !genders.includes(c.gender_bucket)) continue;
    let w = 1;
    if (above != null) {
      if (c.age_bucket === "Less than 22") w = 0;
      else if (c.age_bucket === "23-28") w = 0.5;
    }
    raw += Number(c.india_18plus_ceiling) * w;
  }
  return raw || cap;
}

function pickPrimary(rows: any[]) {
  if (!rows?.length) return null;
  const r = [...rows].sort((a, b) => Number(b.volume) - Number(a.volume))[0];
  return { audience_signal: r.signal, sector: r.sector, layer: r.layer, partner_sources: r.partner_name, scale: Math.round(Number(r.volume)) };
}
function pickPrecision(rows: any[]) {
  const ok = (rows || []).filter((r) => Number(r.reliability) >= 0.7);
  if (!ok.length) return pickPrimary(rows);
  const r = [...ok].sort((a, b) => Number(a.volume) - Number(b.volume))[0];
  return { audience_signal: r.signal, sector: r.sector, layer: r.layer, partner_sources: r.partner_name, scale: Math.round(Number(r.volume)) };
}
function round4(x: number) { return Math.round(x * 10000) / 10000; }
