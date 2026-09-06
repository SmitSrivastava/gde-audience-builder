// Supabase Edge Function: plan-audience
// Parse (Gemini) -> per-anchor embedding kNN match -> score (actual vs intent) -> cube splits.
// Input: { brief } | { query_ir } | { query_ir, filters } (filter slice, no re-parse)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { CORS, embed } from "../_shared/vertex.ts";
import { canonicalAnchor, semanticIrKey } from "../_shared/query-normalization.ts";
import { booleanReach, capParts, reconcileUnion } from "../_shared/audience-algebra.ts";

function normBrief(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9+]+/g, " ").replace(/\s+/g, " ").trim();
}
async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

type Anchor = { id: string; canonical: string; family: string; role: string; tokens: string[] };
type Modifier = { token: string; op: string; param?: number | null; applies_to?: string[] };
type IR = {
  join: "AND" | "OR";
  anchors: Anchor[];
  modifiers: Modifier[];
  dimensions: {
    geo_tier: string[];
    age_bucket: string[];
    gender_bucket: string[];
    city: string | null;
    above_age: number | null;
  };
  exclusions?: string[];
  mode: "conservative" | "expected" | "aggressive";
  refuse: { flag: boolean; reason: string | null };
};

const AGE_ORDER = ["Less than 22", "23-28", "29-34", "35-40", "41-46", "47+"];
const PLATFORM_RE = /(quick[\s-]?commerce|q[\s-]?commerce|qcomm|instant delivery|zepto|blinkit|instamart)/i;
const ACTUAL_PARTNERS = new Set(["Zepto", "Pinelabs", "Razorpay"]);
const PREMIUM_GROUP = new Set(["premium","luxury","affluent","hni","highvalue","superpremium"]);
const ACTUAL_TEXT = /(transactor|spend|purchase|purchased|buyer|order|txn|basket|payment)/i;

function modeCol(mode: IR["mode"]) {
  if (mode === "conservative") return "rho_conservative";
  if (mode === "aggressive") return "rho_aggressive";
  return "rho_expected";
}
const squash = (s: unknown) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
function round4(x: number) { return Math.round(x * 10000) / 10000; }

/* ------- anchor canonicalisation: same intent -> same retrieval text ------- */
const FILLER = new Set([
  "people","folks","users","user","audience","audiences","guys","crowd","group","groups",
  "consumers","customers","segment","segments","cohort","cohorts","base","types","type",
  "who","that","those","and","or","the","a","an","of","for","in","with","lovers","fans",
]);
const B2B_PARTNERS = new Set(["IndiaMart"]);
const B2B_RE = /(b2b|business|wholesale|supplier|suppliers|rfq|distributor|manufacturer|bulk|trade)/i;
function isB2BRow(r: any) {
  if (B2B_PARTNERS.has(String(r.partner_name))) return true;
  return B2B_RE.test(`${r.signal} ${r.category} ${r.sub_category}`);
}
function cleanPhrase(s: string) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9\s/+-]/g, " ")
    .split(/[\s/]+/).filter((w) => w && !FILLER.has(w)).join(" ").trim();
}
// Canonical vocabulary per family, filled once per request from `synonym` + `family`.
let FAMILY_VOCAB: Record<string, string[]> = {};
async function loadFamilyVocab(sb: SupabaseClient) {
  const [{ data: syns }, { data: fams }] = await Promise.all([
    sb.from("synonym").select("token, family, role"),
    sb.from("family").select("family, sector"),
  ]);
  const map: Record<string, string[]> = {};
  for (const f of fams || []) {
    const k = String(f.family).toLowerCase();
    map[k] = [...new Set([...(map[k] || []), cleanPhrase(String(f.family).replace(/_/g, " "))])].filter(Boolean);
  }
  for (const s of syns || []) {
    const k = String(s.family).toLowerCase();
    const t = cleanPhrase(String(s.token));
    if (!t) continue;
    map[k] = [...new Set([...(map[k] || []), t])];
  }
  FAMILY_VOCAB = map;
}
function anchorQueryText(anchor: Anchor) {
  const fam = String(anchor.family || "").toLowerCase();
  const canon = FAMILY_VOCAB[fam] || [];
  const own = [canonicalAnchor(anchor.canonical)].map(cleanPhrase).filter(Boolean);
  const words = [...new Set([...canon, ...own])];
  return (words.join(" ") || cleanPhrase(anchor.canonical) || anchor.canonical).trim();
}



/* ---------------- deterministic fallback parser (only if Vertex is down) ---------------- */
async function pass1(sb: SupabaseClient, brief: string): Promise<IR | null> {
  const n = normBrief(brief);
  const [{ data: syns }, { data: mods }, { data: dims }, { data: cities }] = await Promise.all([
    sb.from("synonym").select("token, family, role, weight"),
    sb.from("modifier_op").select("token, op, scale_param"),
    sb.from("dimension_token").select("token, dim, maps_to"),
    sb.from("city_tier").select("city_name, normalized_city, geo_tier"),
  ]);
  const has = (t: string) => new RegExp(`(^| )${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( |$)`).test(n);

  const anchors: Anchor[] = [];
  const seenFam = new Set<string>();
  for (const s of (syns || []).filter((x: any) => x.role === "anchor")
    .sort((a: any, b: any) => String(b.token).length - String(a.token).length)) {
    const tok = String(s.token).toLowerCase();
    if (!has(tok)) continue;
    if (seenFam.has(s.family)) {
      const a = anchors.find((x) => x.family === String(s.family).toLowerCase());
      if (a && !a.tokens.includes(tok)) a.tokens.push(tok);
      continue;
    }
    seenFam.add(String(s.family).toLowerCase());
    anchors.push({
      id: `a${anchors.length + 1}`, canonical: tok, family: String(s.family).toLowerCase(),
      role: anchors.length ? "and" : "primary", tokens: [tok],
    });
  }
  if (PLATFORM_RE.test(n) && !anchors.some((a) => PLATFORM_RE.test(a.canonical))) {
    anchors.unshift({
      id: "a0", canonical: "quick commerce", family: "grocery_retail", role: "primary",
      tokens: ["quick commerce", "qcommerce", "q-commerce", "instant delivery"],
    });
    anchors.forEach((a, i) => { a.id = `a${i + 1}`; a.role = i === 0 ? "primary" : "and"; });
  }
  if (!anchors.length) return null;

  const modifiers: Modifier[] = [];
  for (const m of mods || []) {
    const tok = String(m.token).toLowerCase();
    if (has(tok)) modifiers.push({ token: tok, op: m.op, param: m.scale_param ?? 0.12, applies_to: [anchors[0].id] });
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
  }
  const above = n.match(/(?:above|over|older than)\s+(\d{2})/) || n.match(/(\d{2})\s*\+/);
  const ageNum = above ? Number(above[1]) : NaN;
  if (!Number.isNaN(ageNum) && ageNum >= 18 && ageNum <= 60) {
    dimensions.above_age = ageNum;
    dimensions.age_bucket = AGE_ORDER.slice(1);
  }
  for (const c of cities || []) {
    const key = String(c.normalized_city || c.city_name || "").toLowerCase();
    if (key && has(key)) { dimensions.city = String(c.city_name); break; }
  }
  const joinAnd = / and | plus | who also | along with /.test(` ${n} `) && anchors.length >= 2;
  return {
    join: joinAnd ? "AND" : "OR",
    anchors, modifiers, dimensions,
    mode: "expected",
    refuse: { flag: false, reason: null },
  };
}

/* ------------------------------------- handler ------------------------------------- */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  try {
    const body = await req.json();
    let ir: IR | null = body.query_ir ?? null;
    const brief: string = body.brief ?? "";
    let source = ir ? "client" : "";

    // Filter slice: same parse, dimensions overridden by the page filters.
    if (ir && body.filters) {
      ir = {
        ...ir,
        dimensions: {
          ...ir.dimensions,
          geo_tier: body.filters.geo_tier?.length ? body.filters.geo_tier : [],
          age_bucket: body.filters.age_bucket?.length ? body.filters.age_bucket : [],
          gender_bucket: body.filters.gender_bucket?.length ? body.filters.gender_bucket : [],
        },
      };
      source = "filter";
    }

    if (!ir && brief) {
      try {
        const vr = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/vertex-parse`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ brief }),
        });
        const vj = await vr.json().catch(() => ({}));
        if (vj?.query_ir?.anchors?.length) {
          ir = vj.query_ir as IR;
          source = vj.cached ? "cache" : "gemini";
        }
      } catch (e) {
        console.error("vertex-parse unavailable", e);
      }
      if (!ir) {
        const p1 = await pass1(sb, brief);
        if (p1) { ir = p1; source = "rules"; }
      }
      if (!ir) {
        return new Response(JSON.stringify({
          refuse: { flag: true, reason: "No known audience family found in this brief. Try a product or category noun, e.g. skincare, snacks, quick commerce." },
          people_reach: 0, source: "refuse",
        }), { headers: { ...CORS, "Content-Type": "application/json" } });
      }
    }
    if (!ir) return new Response(JSON.stringify({ error: "brief or query_ir required" }), { status: 400, headers: CORS });
    if (ir.refuse?.flag) {
      return new Response(JSON.stringify({ refuse: ir.refuse, people_reach: 0, query_ir: ir, source }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    ir = JSON.parse(semanticIrKey(ir)) as IR;
const ENGINE_VERSION = "v21-stable-exclusion-family";
    const evidence: "actual" | "intent" | null =
      body.evidence === "actual" || body.evidence === "intent" ? body.evidence : null;
    const disabledIds = Array.isArray(body.disabled_ids)
      ? body.disabled_ids.map(String).sort()
      : [];
    const extraIds = Array.isArray(body.extra_ids)
      ? body.extra_ids.map(String).sort()
      : [];
    const irHash = await sha256(
      ENGINE_VERSION + semanticIrKey(ir as unknown as Record<string, unknown>) + JSON.stringify(body.baseline ?? null) + String(evidence) + JSON.stringify(disabledIds) + JSON.stringify(extraIds),
    );
    const cached = await sb.from("result_cache").select("payload").eq("query_ir_hash", irHash).maybeSingle();
    if (cached.data?.payload) {
      return new Response(JSON.stringify({ ...cached.data.payload, source, cached: true }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const payload = await plan(sb, ir, body.baseline ?? null, evidence, disabledIds, extraIds);

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

/* --------------------------------- matching (embeddings) --------------------------------- */
type Hit = {
  master_signal_id: string; partner_name: string; pii: string; signal: string;
  product_families: string; platform_tags: string | null; layer: string; sector: string;
  category: string; sub_category: string; volume: number; reliability: number; sim: number;
  cls: "actual" | "intent"; nest_key?: string | null;
};

function classify(r: any): "actual" | "intent" {
  if (ACTUAL_PARTNERS.has(r.partner_name)) return "actual";
  if (ACTUAL_TEXT.test(`${r.signal} ${r.category} ${r.sub_category}`)) return "actual";
  return "intent";
}

async function matchAnchor(sb: SupabaseClient, anchor: Anchor, mods: Modifier[], otherFamilies: string[]) {
  const isPlatform = PLATFORM_RE.test(anchor.canonical) || PLATFORM_RE.test(anchor.tokens.join(" "));
  const wantsB2B = B2B_RE.test([anchor.canonical, ...anchor.tokens, anchor.family].join(" "));
  const queryText = anchorQueryText(anchor);
  const [vec] = await embed([queryText], "RETRIEVAL_QUERY");
  const { data: knn, error } = await sb.rpc("match_signals", {
    query_embedding: JSON.stringify(vec),
    match_count: 60,
    min_sim: 0.5,
  });
  if (error) throw error;

  let rows: any[] = [...(knn || [])].sort((a: any, b: any) =>
    Number(b.sim) - Number(a.sim) || String(a.master_signal_id).localeCompare(String(b.master_signal_id))
  );

  // Family rows keep the matcher honest for exact family asks.
  if (anchor.family && !isPlatform) {
    const { data: fam } = await sb.from("signal")
      .select("master_signal_id, partner_name, pii, signal, product_families, platform_tags, layer, sector, category, sub_category, volume, reliability")
      .eq("row_role", "intent").gt("reliability", 0)
      .ilike("product_families", `%${anchor.family}%`).limit(2000);
    const exact = (fam || []).filter((r: any) =>
      String(r.product_families || "").split(",").map((s: string) => s.trim()).includes(anchor.family)
    );
    const tokenHit = exact.filter((r: any) =>
      [anchor.canonical, ...anchor.tokens].some((t) => squash(`${r.signal} ${r.sub_category} ${r.category}`).includes(squash(t)))
    );
    // Always seed the family's own consumer rows so two phrasings of the same
    // intent cannot land on wildly different candidate sets.
    const familyFloor = [...exact].sort((a: any, b: any) => Number(b.volume) - Number(a.volume)).slice(0, 40);
    const add = [...tokenHit, ...familyFloor];
    const seen = new Set(rows.map((r) => r.master_signal_id));
    for (const r of add) {
      if (seen.has(r.master_signal_id)) continue;
      seen.add(r.master_signal_id);
      rows.push({ ...r, sim: 0.5 });
    }
  }

  // Business / RFQ supplier rows never belong in a consumer audience.
  if (!wantsB2B) {
    const consumer = rows.filter((r: any) => !isB2BRow(r));
    if (consumer.length) rows = consumer;
  }


  if (isPlatform) {
    if (otherFamilies.length) {
      // Platform AND product family -> only that platform's rows in that family.
      const { data: pf } = await sb.from("signal")
        .select("master_signal_id, partner_name, pii, signal, product_families, platform_tags, layer, sector, category, sub_category, volume, reliability")
        .eq("row_role", "intent").gt("reliability", 0)
        .eq("platform_tags", "quick_commerce").limit(3000);
      rows = (pf || []).filter((r: any) => {
        const fams = String(r.product_families || "").split(",").map((s: string) => s.trim());
        return otherFamilies.some((f) => fams.includes(f));
      }).map((r: any) => ({ ...r, sim: 0.9 }));
    } else {
      // Platform only -> the platform's own user universe (KPI), plus its top nodes and
      // the semantic q-commerce overlays from other partners for the signals table.
      const { data: zp } = await sb.from("signal")
        .select("master_signal_id, partner_name, pii, signal, product_families, platform_tags, layer, sector, category, sub_category, volume, reliability")
        .eq("platform_tags", "quick_commerce").eq("row_role", "intent")
        .order("volume", { ascending: false }).limit(12);
      const DIMLIKE = /^(android|ios|male|female|others?|[\d]+\s*-\s*[\d]+k|sampling)$/i;
      const seenP = new Set(rows.map((r: any) => r.master_signal_id));
      for (const r of zp || []) {
        if (seenP.has(r.master_signal_id) || DIMLIKE.test(String(r.signal || "").trim())) continue;
        rows.push({ ...r, sim: 0.9 });
      }
      // Interest-backed q-commerce overlays from other partners.
      const { data: ov } = await sb.from("signal")
        .select("master_signal_id, partner_name, pii, signal, product_families, platform_tags, layer, sector, category, sub_category, volume, reliability")
        .eq("row_role", "intent").gt("reliability", 0)
        .is("platform_tags", null)
        .or("signal.ilike.%commerce%,signal.ilike.%grocery%,sub_category.ilike.%commerce%")
        .order("volume", { ascending: false }).limit(15);
      for (const r of ov || []) if (!seenP.has(r.master_signal_id)) rows.push({ ...r, sim: 0.6 });
      rows = rows.filter((r: any) => !DIMLIKE.test(String(r.signal || "").trim()));
    }
  }

  // Anchor's own modifiers only.
  const myMods = mods.filter((m) => !m.applies_to?.length || m.applies_to.includes(anchor.id));
  const preMod: any[] = rows;
  let scale = 1;
  let nested = false;
  for (const m of myMods) {
    const t = squash(m.token);
    if (!t) continue;
    const group = PREMIUM_GROUP.has(t) ? [...PREMIUM_GROUP] : [t];
    let preferred = rows.filter((r) =>
      group.some((g) => squash(`${r.signal} ${r.sub_category} ${r.category} ${r.product_families}`).includes(g))
    );
    // Semantic fallback inside this list only (affluent -> Luxury Skin Care).
    if (!preferred.length && PREMIUM_GROUP.has(t)) {
      try {
        const [mv] = await embed(["premium luxury affluent high value"], "RETRIEVAL_QUERY");
        const { data: near } = await sb.rpc("match_signals", {
          query_embedding: JSON.stringify(mv), match_count: 200, min_sim: 0.5,
        });
        const ok = new Set((near || []).map((r: any) => r.master_signal_id));
        preferred = rows.filter((r) => ok.has(r.master_signal_id));
      } catch (_e) { /* fall through to scale */ }
    }
    if (preferred.length) { rows = preferred; nested = true; }
    else scale = Math.min(scale, Number(m.param) || 0.12);
  }

  const hits: Hit[] = rows.map((r: any) => ({
    ...r, volume: Number(r.volume), reliability: Number(r.reliability), cls: classify(r),
    // Modifier-kept rows of one partner describe the same premium cohort: parent absorbs child.
    nest_key: nested ? `${r.partner_name}::${r.pii}::mod` : null,
  }));
  const contextHits: Hit[] = preMod.map((r: any) => ({
    ...r, volume: Number(r.volume), reliability: Number(r.reliability), cls: classify(r), nest_key: null,
  }));
  return { hits, contextHits, isPlatform, scale, modifiers: myMods };
}


/* --------------------------------- scoring --------------------------------- */
// Cube-derived share of each signal that survives the selected geo/age/gender slice.
// A signal with no cells inside the slice contributes 0 — never its national volume.
// With no filter selected every share is exactly 1, so filtered <= unfiltered always.
async function sliceShares(
  sb: SupabaseClient, ids: string[], geos: string[], ages: string[], genders: string[], above: number | null,
) {
  const out: Record<string, number> = {};
  if (!ids.length) return out;
  const filtered = !!(geos.length || ages.length || genders.length || above != null);
  if (!filtered) {
    for (const id of ids) out[id] = 1;
    return out;
  }
  for (const id of ids) out[id] = 0;
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const [full, cut] = await Promise.all([
      sb.rpc("slice_signals", { ids: chunk, geos: null, ages: null, genders: null, above_age: null }),
      sb.rpc("slice_signals", { ids: chunk, geos: geos.length ? geos : null, ages: ages.length ? ages : null, genders: genders.length ? genders : null, above_age: above }),
    ]);
    if (full.error) throw full.error;
    if (cut.error) throw cut.error;
    const f: Record<string, number> = {};
    for (const s of full.data || []) f[s.master_signal_id] = Number(s.slice_volume) || 0;
    for (const s of cut.data || []) {
      const tot = f[s.master_signal_id] || 0;
      out[s.master_signal_id] = tot > 0 ? Math.min(1, (Number(s.slice_volume) || 0) / tot) : 0;
    }
  }
  return out;
}

async function uniquePeopleForClass(
  sb: SupabaseClient,
  rows: Hit[],
  shareMap: Record<string, number>,
  mode: IR["mode"],
  population: number,
) {
  if (!rows.length) return 0;
  const [{ data: intra }, { data: pr }, { data: uni }] = await Promise.all([
    sb.from("intra_overlap_rule").select("*"),
    sb.from("partner_rho").select("*"),
    sb.from("partner_universe").select("*"),
  ]);
  const rhoOf = (id: string) => {
    const r = (intra || []).find((x: any) => x.rule_id === id);
    return r ? Number(r[modeCol(mode)]) : 0.14;
  };

  type It = { partner: string; pii: string; families: string[]; sector: string; vol: number; name: string; nest: string | null };
  const items: It[] = [];
  for (const r of rows) {
    const share = shareMap[r.master_signal_id] ?? 0;
    const vol = Number(r.volume || 0) * share * Number(r.reliability || 1);
    if (vol <= 0) continue;
    items.push({
      partner: r.partner_name, pii: r.pii,
      families: String(r.product_families || "").split(",").map((s) => s.trim()).filter(Boolean), sector: String(r.sector || ""),
      vol, name: String(r.signal || "").toLowerCase(), nest: r.nest_key ?? null,
    });
  }

  // The same partner signal/SKU represented by phone and device is one person set.
  const identifierGroups = new Map<string, It[]>();
  for (const it of items) {
    const key = `${it.partner}::${squash(it.name)}::${it.nest || ""}`;
    identifierGroups.set(key, [...(identifierGroups.get(key) || []), it]);
  }
  const deduped: It[] = [];
  for (const group of identifierGroups.values()) {
    const largest = [...group].sort((a, b) => b.vol - a.vol)[0];
    deduped.push({ ...largest, vol: Math.max(...group.map((row) => row.vol)) });
  }

  // Within one partner and evidence class, smaller same-family/sector rows are
  // mostly nested inside the largest row; they are never blindly summed.
  const groups = new Map<string, It[]>();
  for (const it of deduped) groups.set(it.partner, [...(groups.get(it.partner) || []), it]);
  const nodes: { partner: string; people: number; families: Set<string>; sectors: Set<string> }[] = [];
  for (const [partner, lst0] of groups) {
    const lst = [...lst0].sort((a, b) => b.vol - a.vol);
    let u = lst[0].vol;
    const accF = new Set(lst[0].families);
    const accS = new Set([lst[0].sector].filter(Boolean));
    for (const cur of lst.slice(1)) {
      const sameFamily = cur.families.some((f) => accF.has(f));
      const sameSector = !!cur.sector && accS.has(cur.sector);
      const rho = sameFamily || sameSector ? 0.85 : Math.max(0.35, rhoOf("R5_SIBLING"));
      u = booleanReach(u, cur.vol, population, rho).union;
      cur.families.forEach((f) => accF.add(f));
      if (cur.sector) accS.add(cur.sector);
    }
    const caps = (uni || []).filter((x: any) => x.partner_name === partner).map((x: any) => Number(x.universe));
    if (caps.length) u = Math.min(u, Math.max(...caps));
    u = Math.min(u, lst.reduce((s, x) => s + x.vol, 0));
    nodes.push({ partner, people: u, families: accF, sectors: accS });
  }

  // Across partners, calculate AND once and derive OR as A+B-AND.
  nodes.sort((a, b) => b.people - a.people);
  let reach = nodes[0].people;
  const accF = new Set(nodes[0].families);
  const accS = new Set(nodes[0].sectors);
  const priorPartners = [nodes[0].partner];
  for (const n of nodes.slice(1)) {
    const same = [...n.families].some((f) => accF.has(f));
    const sameSector = [...n.sectors].some((sector) => accS.has(sector));
    const rel = same ? "same_family" : sameSector ? "sibling_family" : "distant_family";
    const candidates = (pr || []).filter((x: any) => priorPartners.some((partner) =>
      ((x.partner_a === partner && x.partner_b === n.partner) || (x.partner_b === partner && x.partner_a === n.partner)) &&
      x.attribute_relation === rel
    ));
    const stored = Math.max(0, ...candidates.map((x: any) => Number(x.rho_same_pii || x.base_rho || 0)));
    const rho = same ? Math.min(0.70, Math.max(0.65, stored)) : Math.min(0.85, Math.max(0.08, stored));
    reach = booleanReach(reach, n.people, population, rho).union;
    n.families.forEach((f) => accF.add(f));
    n.sectors.forEach((sector) => accS.add(sector));
    priorPartners.push(n.partner);
  }
  return Math.min(reach, population);
}

async function pairRho(sb: SupabaseClient, familyA: string, familyB: string) {
  const { data } = await sb.from("and_intersect_rho").select("rho_and_expected")
    .or(`and(family_a.eq.${familyA},family_b.eq.${familyB}),and(family_a.eq.${familyB},family_b.eq.${familyA})`);
  return data?.[0] ? Number(data[0].rho_and_expected) : (familyA === familyB ? 0.75 : 0.12);
}

async function exclusionAnchors(sb: SupabaseClient, exclusions: string[]): Promise<Anchor[]> {
  if (!exclusions.length) return [];
  const { data } = await sb.from("synonym").select("token, family").eq("role", "anchor");
  return exclusions.map((value, index) => {
    const canonical = canonicalAnchor(value);
    const exact = (data || []).find((row: any) => canonicalAnchor(String(row.token)) === canonical);
    const vocabFamily = Object.entries(FAMILY_VOCAB).find(([, terms]) =>
      terms.some((term) => canonicalAnchor(term) === canonical)
    )?.[0];
    return {
      id: `x${index + 1}`,
      canonical,
      family: String(exact?.family || vocabFamily || canonical.replace(/\s+/g, "_")).toLowerCase(),
      role: "exclude",
      tokens: [canonical],
    };
  }).filter((anchor) => anchor.canonical);
}

async function platformUniverse(sb: SupabaseClient, geos: string[], ages: string[], genders: string[], above: number | null) {
  const { data: uni } = await sb.from("partner_universe").select("*").eq("partner_name", "Zepto");
  const total = Math.max(0, ...(uni || []).map((u: any) => Number(u.universe)));
  // Slice the platform universe with the platform's own cube shape.
  const { data: zrows } = await sb.from("signal")
    .select("master_signal_id")
    .eq("partner_name", "Zepto").eq("row_role", "intent").limit(400);
  const ids = (zrows || []).map((r: any) => r.master_signal_id);
  if (!ids.length || (!geos.length && !ages.length && !genders.length && above == null)) return total;
  let f = 0, c = 0;
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const [full, cut] = await Promise.all([
      sb.rpc("slice_signals", { ids: chunk, geos: null, ages: null, genders: null, above_age: null }),
      sb.rpc("slice_signals", { ids: chunk, geos: geos.length ? geos : null, ages: ages.length ? ages : null, genders: genders.length ? genders : null, above_age: above }),
    ]);
    for (const s of full.data || []) f += Number(s.slice_volume) || 0;
    for (const s of cut.data || []) c += Number(s.slice_volume) || 0;
  }
  const share = f > 0 ? Math.min(1, c / f) : 0;
  return total * share;

}

async function popSlice(sb: SupabaseClient, geos: string[], ages: string[], genders: string[], above: number | null) {
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
  return pop || 9.5e8;
}

// Bars come from the same cube cells that drive the headline. Each signal's cells are
// rescaled to that signal's own volume so cube-thin rows can never distort the mix.
async function splits(
  sb: SupabaseClient, ids: string[], geos: string[], ages: string[], genders: string[], above: number | null,
  volOf: Record<string, number> = {},
) {
  const geo: Record<string, number> = {}, age: Record<string, number> = {}, gen: Record<string, number> = {};
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await sb.from("signal_cell")
      .select("master_signal_id, geo_tier, age_bucket, gender_bucket, volume")
      .in("master_signal_id", ids.slice(i, i + 200)).limit(60000);
    const rows = data || [];
    const totals: Record<string, number> = {};
    for (const r of rows) totals[r.master_signal_id] = (totals[r.master_signal_id] || 0) + (Number(r.volume) || 0);
    for (const r of rows) {
      if (geos.length && !geos.includes(r.geo_tier)) continue;
      if (ages.length && !ages.includes(r.age_bucket)) continue;
      if (genders.length && !genders.includes(r.gender_bucket)) continue;
      let w = 1;
      if (above != null) {
        if (r.age_bucket === "Less than 22") w = 0;
        else if (r.age_bucket === "23-28") w = 0.5;
      }
      const tot = totals[r.master_signal_id] || 0;
      const target = volOf[r.master_signal_id];
      const k = tot > 0 && target ? target / tot : 1;
      const v = Number(r.volume) * w * k;
      geo[r.geo_tier] = (geo[r.geo_tier] || 0) + v;
      age[r.age_bucket] = (age[r.age_bucket] || 0) + v;
      gen[r.gender_bucket] = (gen[r.gender_bucket] || 0) + v;
    }
  }

  const n = (d: Record<string, number>) => {
    const s = Object.values(d).reduce((a, b) => a + b, 0) || 1;
    return Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v / s]));
  };
  const total = Object.values(geo).reduce((a, b) => a + b, 0);
  return { geo: n(geo), age: n(age), gen: n(gen), total };
}

/* --------------------------------- plan --------------------------------- */
type Baseline = { people_reach?: number; actual_people?: number; intent_people?: number } | null;

const peopleOf = (r: Hit) => Number(r.volume || 0) * Number(r.reliability || 1);
const TEST_RE = /(sample|test|dummy)/i;

async function plan(
  sb: SupabaseClient,
  ir: IR,
  baseline: Baseline = null,
  evidence: "actual" | "intent" | null = null,
  disabledIds: string[] = [],
  extraIds: string[] = [],
) {
  await loadFamilyVocab(sb);
  let geos = ir.dimensions.geo_tier || [];

  if (ir.dimensions.city) {
    const { data } = await sb.from("city_tier").select("geo_tier, city_name, normalized_city");
    const key = ir.dimensions.city.toLowerCase();
    const hit = (data || []).find((c: any) =>
      c.city_name?.toLowerCase() === key || c.normalized_city?.toLowerCase() === key);
    if (hit?.geo_tier) geos = [hit.geo_tier];
  }
  const ages = ir.dimensions.age_bucket || [];
  const genders = ir.dimensions.gender_bucket || [];
  const above = ir.dimensions.above_age;
  const mods = ir.modifiers || [];

  const anchors = ir.anchors || [];
  const productFamilies = anchors.filter((a) => !PLATFORM_RE.test(a.canonical)).map((a) => a.family).filter(Boolean);

  const disabled = new Set(disabledIds);
  const extra = new Set(extraIds);
  const population = await popSlice(sb, geos, ages, genders, above);

  /* 1. match every anchor once */
  const matches: { anchor: Anchor; hits: Hit[]; isPlatform: boolean; scale: number; others: string[] }[] = [];
  for (const a of anchors) {
    const others = PLATFORM_RE.test(a.canonical) ? productFamilies : [];
    const m = await matchAnchor(sb, a, mods, others);
    matches.push({ anchor: a, hits: m.hits, isPlatform: m.isPlatform, scale: m.scale, others });
  }

  /* 2. the matched table: what the planner actually sees and ticks */
  // Keep each anchor's selected population stable whether it is planned alone or
  // beside other anchors. A combined query must reuse the same A and B values.
  const perAnchor = 25;
  const tableByAnchor: Hit[][] = matches.map(() => []);
  matches.forEach((m, i) => {
    for (const r of [...m.hits].sort((a, b) => peopleOf(b) - peopleOf(a))) {
      if (TEST_RE.test(r.signal)) continue;
      tableByAnchor[i].push(r);
      if (tableByAnchor[i].length >= perAnchor) break;
    }
  });
  const takenIds = new Set(tableByAnchor.flat().map((r) => r.master_signal_id));

  /* 3. expand selection: catalog rows close to the anchors but outside the table */
  const suggestionByAnchor: Hit[][] = matches.map(() => []);
  const suggestedIds = new Set<string>();
  matches.forEach((m, i) => {
    for (const r of [...m.hits].sort((a, b) => Number(b.sim || 0) - Number(a.sim || 0) || peopleOf(b) - peopleOf(a))) {
      if (takenIds.has(r.master_signal_id) || suggestedIds.has(r.master_signal_id)) continue;
      if (TEST_RE.test(r.signal) || peopleOf(r) < 1000) continue;
      suggestedIds.add(r.master_signal_id);
      suggestionByAnchor[i].push(r);
      if (suggestionByAnchor[i].length >= 12) break;
    }
  });
  const suggestionRows = suggestionByAnchor.flat().slice(0, 12);
  const suggestionKeep = new Set(suggestionRows.map((r) => r.master_signal_id));

  /* 4. live set = ticked table rows + ticked suggestions */
  const scored: { anchor: Anchor; live: Hit[]; total: number; actual: number; intent: number }[] = [];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const live = [
      ...tableByAnchor[i].filter((r) => !disabled.has(r.master_signal_id)),
      ...suggestionByAnchor[i].filter((r) => suggestionKeep.has(r.master_signal_id) && extra.has(r.master_signal_id)),
    ];
    const ids = [...new Set(live.map((h) => h.master_signal_id))];
    const shareMap = await sliceShares(sb, ids, geos, ages, genders, above);
    let total = await uniquePeopleForClass(sb, live, shareMap, ir.mode, population);
    let actual = await uniquePeopleForClass(sb, live.filter((h) => h.cls === "actual"), shareMap, ir.mode, population);
    const intent = await uniquePeopleForClass(sb, live.filter((h) => h.cls === "intent"), shareMap, ir.mode, population);

    if (m.isPlatform) {
      const capAll = await platformUniverse(sb, geos, ages, genders, above);
      if (!m.others.length) actual = capAll;
      actual = Math.min(actual, capAll);
      total = Math.max(total, actual);
    }
    const scaledActual = actual * m.scale;
    const scaledIntent = intent * m.scale;
    scored.push({
      anchor: m.anchor,
      live,
      // Purchase and interest are each complete counts; the anchor total is their union.
      total: Math.min(reconcileUnion(total * m.scale, scaledActual, scaledIntent), population),
      actual: scaledActual,
      intent: scaledIntent,
    });
  }


  /* 5. Boolean algebra across anchors */
  let people = 0, actualPeople = 0, intentPeople = 0;
  if (scored.length) {
    people = scored[0].total;
    actualPeople = scored[0].actual;
    intentPeople = scored[0].intent;
    let family = scored[0].anchor.family;
    for (const current of scored.slice(1)) {
      const rho = await pairRho(sb, family, current.anchor.family);
      // AND is calculated exactly once per measure. OR is then A+B-AND;
      // it never estimates overlap through a separate path.
      const totalBoolean = booleanReach(people, current.total, population, rho);
      const actualBoolean = booleanReach(actualPeople, current.actual, population, rho);
      const intentBoolean = booleanReach(intentPeople, current.intent, population, rho);
      people = ir.join === "AND" ? totalBoolean.intersection : totalBoolean.union;
      actualPeople = ir.join === "AND" ? actualBoolean.intersection : actualBoolean.union;
      intentPeople = ir.join === "AND" ? intentBoolean.intersection : intentBoolean.union;
      family = current.anchor.family;
    }

    for (const excluded of await exclusionAnchors(sb, ir.exclusions || [])) {
      const matchedX = await matchAnchor(sb, excluded, [], []);
      // Excluded B must be the identical population returned when B is planned
      // alone: same ordering, same selection limit, same scaling and same classes.
      const excludedLive = [...matchedX.hits]
        .filter((hit) => !TEST_RE.test(hit.signal))
        .sort((a, b) => peopleOf(b) - peopleOf(a))
        .slice(0, perAnchor);
      const ids = [...new Set(excludedLive.map((hit) => hit.master_signal_id))];
      const shares = await sliceShares(sb, ids, geos, ages, genders, above);
      const rawXTotal = await uniquePeopleForClass(sb, excludedLive, shares, ir.mode, population);
      const xActual = (await uniquePeopleForClass(sb, excludedLive.filter((h) => h.cls === "actual"), shares, ir.mode, population)) * matchedX.scale;
      const xIntent = (await uniquePeopleForClass(sb, excludedLive.filter((h) => h.cls === "intent"), shares, ir.mode, population)) * matchedX.scale;
      const xTotal = Math.min(reconcileUnion(rawXTotal * matchedX.scale, xActual, xIntent), population);
      const rho = await pairRho(sb, family, excluded.family);
       people = booleanReach(people, xTotal, population, rho).difference;
       actualPeople = booleanReach(actualPeople, xActual, population, rho).difference;
       intentPeople = booleanReach(intentPeople, xIntent, population, rho).difference;
    }
  }

  const liveHits = scored.flatMap((s) => s.live);
  const evidenceHits = evidence ? liveHits.filter((h) => h.cls === evidence) : liveHits;
  const allIds = [...new Set(evidenceHits.map((h) => h.master_signal_id))];
  const volOf: Record<string, number> = {};
  for (const h of evidenceHits) volOf[h.master_signal_id] = peopleOf(h);
  const mix = await splits(sb, allIds, geos, ages, genders, above, volOf);
  const filtered = !!(geos.length || ages.length || genders.length || above != null);
  const mixAll = filtered ? await splits(sb, allIds, [], [], [], null, volOf) : mix;
  const keepShare = filtered && mixAll.total > 0 ? Math.min(1, mix.total / mixAll.total) : 1;
  const cap = await popSlice(sb, geos, ages, genders, above);

  // Invariant: a narrowed audience can never exceed the unfiltered one.
  if (baseline && Number(baseline.people_reach) > 0 && filtered) {
    const ceiling = Number(baseline.people_reach) * keepShare;
    ({ total: people, actual: actualPeople, intent: intentPeople } = capParts(people, actualPeople, intentPeople, ceiling));
    actualPeople = Math.min(actualPeople, Number(baseline.actual_people || 0) * keepShare);
    intentPeople = Math.min(intentPeople, Number(baseline.intent_people || 0) * keepShare);
  }

  ({ total: people, actual: actualPeople, intent: intentPeople } = capParts(people, actualPeople, intentPeople, cap));
  people = Math.max(0, people);


  // The evidence toggle is a subset of the same result, never a new calculation.
  const headline = evidence === "actual" ? actualPeople : evidence === "intent" ? intentPeople : people;

  const geo_split = Object.entries(mix.geo).map(([k, sh]) => ({ geo_tier: k, volume: Math.round(headline * sh), share: round4(sh) }));
  const age_split = Object.entries(mix.age).map(([k, sh]) => ({ age_bucket: k, volume: Math.round(headline * sh), share: round4(sh) }));
  const gender_split = Object.entries(mix.gen).map(([k, sh]) => ({ gender_bucket: k, volume: Math.round(headline * sh), share: round4(sh) }));

  const rowOut = (r: Hit, selected: boolean) => ({
    audience_signal: r.signal,
    sector: r.sector,
    layer: r.layer,
    partner_sources: r.partner_name,
    klass: r.cls === "actual" ? "Actual" : "Intent",
    scale: Math.round(peopleOf(r)),
    master_signal_id: r.master_signal_id,
    selected,
  });
  const tableRows = tableByAnchor.flat()
    .filter((r) => !evidence || r.cls === evidence)
    .sort((a, b) => peopleOf(b) - peopleOf(a))
    .map((r) => rowOut(r, !disabled.has(r.master_signal_id)));
  const suggestions = suggestionRows
    .filter((r) => !evidence || r.cls === evidence)
    .map((r) => rowOut(r, extra.has(r.master_signal_id)));

  const modLine = mods.length
    ? mods.map((m) => {
      const names = (m.applies_to || []).map((id) => anchors.find((a) => a.id === id)?.canonical).filter(Boolean);
      const label = m.token.charAt(0).toUpperCase() + m.token.slice(1);
      return names.length ? `${label} (on ${names.map((n) => title(String(n))).join(", ")} only)` : label;
    }).join(" · ")
    : "none";
  const dimBits = [
    geos.length ? geos.join(", ") : null,
    ages.length ? ages.join(", ") : null,
    genders.length ? genders.join(", ") : null,
    ir.dimensions.city,
    above != null ? `Above ${above}` : null,
  ].filter(Boolean);

  const includedLabel = anchors.map((a) => title(a.canonical)).join(` ${ir.join} `) || "—";
  const exclusionLabel = (ir.exclusions || []).map((value) => title(canonicalAnchor(value))).filter(Boolean);
  const baseCohort = exclusionLabel.length ? `${includedLabel} EXCLUDING ${exclusionLabel.join(" AND ")}` : includedLabel;

  return {
    query_ir: ir,
    base_cohort: baseCohort,
    modifier_line: modLine,
    dimension_line: dimBits.length ? dimBits.join(" · ") : "none",
    evidence,
    people_reach: Math.round(headline),
    total_people: Math.round(people),
    actual_people: Math.round(actualPeople),
    intent_people: Math.round(intentPeople),
    india_intelligence: Math.round(headline),
    identifier_reach: Math.round(headline),
    planning_confidence: liveHits.some((r) => r.reliability >= 0.7 && peopleOf(r) >= 10000) ? "High" : "Medium",
    matched_signals: tableRows,
    suggested_signals: suggestions,
    geo_split, age_split, gender_split,
    partners: [...new Set(evidenceHits.map((h) => h.partner_name))],
    session: {
      matched_ids: allIds.slice(0, 400),
      anchors: anchors.map((a) => a.canonical),
      join: ir.join,
    },
    how_built: {
      join: ir.join,
      anchors: anchors.map((a) => a.canonical),
      exclusions: ir.exclusions || [],
      modifiers: mods,
      rules: [
        `Anchors: ${anchors.map((a) => title(a.canonical)).join(` ${ir.join} `)}`,
        `Purchase-backed people counted in full: ${Math.round(actualPeople).toLocaleString("en-IN")} · interest-backed people counted in full: ${Math.round(intentPeople).toLocaleString("en-IN")}`,
        `Total, purchase and interest each use the same Boolean equation independently: ${Math.round(people).toLocaleString("en-IN")} total`,

        anchors.length < 2
          ? "Single anchor: people counted once after phone/device de-duplication and partner overlap."
          : ir.join === "AND"
          ? "Two or more anchors combined as an intersection A ∩ B."
          : "Two or more anchors combined as A + B − the exact same A ∩ B used by AND.",
        ...(exclusionLabel.length ? [`Excludes overlap with ${exclusionLabel.join(" and ")}`] : []),
        `${liveHits.length} of ${tableByAnchor.flat().length} table signals in the scale${extra.size ? ` plus ${extra.size} added from expand selection` : ""}`,
      ],
    },
  };
}

function title(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

