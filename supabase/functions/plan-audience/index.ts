// Supabase Edge Function: plan-audience
// Parse (Gemini) -> per-anchor embedding kNN match -> score (actual vs intent) -> cube splits.
// Input: { brief } | { query_ir } | { query_ir, filters } (filter slice, no re-parse)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { CORS, embed } from "../_shared/vertex.ts";
import { canonicalAnchor, semanticIrKey } from "../_shared/query-normalization.ts";
import { boundedIntersection, boundedUnion, reconcileReach, selectEvidence, subtractAudience } from "../_shared/audience-algebra.ts";

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
    const ENGINE_VERSION = "v13-boolean-algebra";
    const evidence: "actual" | "intent" | null =
      body.evidence === "actual" || body.evidence === "intent" ? body.evidence : null;
    const irHash = await sha256(
      ENGINE_VERSION + semanticIrKey(ir as unknown as Record<string, unknown>) + JSON.stringify(body.baseline ?? null) + String(evidence),
    );
    const cached = await sb.from("result_cache").select("payload").eq("query_ir_hash", irHash).maybeSingle();
    if (cached.data?.payload) {
      return new Response(JSON.stringify({ ...cached.data.payload, source, cached: true }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const payload = await plan(sb, ir, body.baseline ?? null, evidence);
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

async function unionPeople(sb: SupabaseClient, rows: Hit[], shareMap: Record<string, number>, mode: IR["mode"]) {
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

  type It = { partner: string; pii: string; families: string[]; vol: number; name: string; nest: string | null };
  const items: It[] = [];
  for (const r of rows) {
    const share = shareMap[r.master_signal_id] ?? 0;
    const vol = Number(r.volume || 0) * share * Number(r.reliability || 1);
    if (vol <= 0) continue;
    items.push({
      partner: r.partner_name, pii: r.pii,
      families: String(r.product_families || "").split(",").map((s) => s.trim()).filter(Boolean),
      vol, name: String(r.signal || "").toLowerCase(), nest: r.nest_key ?? null,
    });
  }

  const groups = new Map<string, It[]>();
  for (const it of items) {
    const k = `${it.partner}::${it.pii}`;
    groups.set(k, [...(groups.get(k) || []), it]);
  }
  const nodes: { partner: string; pii: string; people: number; families: Set<string> }[] = [];
  for (const [k, lst0] of groups) {
    const lst = [...lst0].sort((a, b) => b.vol - a.vol);
    let u = lst[0].vol;
    const accF = new Set(lst[0].families);
    const accN = lst[0].name;
    for (const cur of lst.slice(1)) {
      const nested = cur.nest === lst[0].nest && cur.nest != null
        ? true
        : (cur.name.length > 6 && accN.includes(cur.name)) || (accN.length > 6 && cur.name.includes(accN));
      if (nested) continue;
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

  // Identifiers of the same partner (phone / device) are the same people -> MAX, never add.
  const byP = new Map<string, typeof nodes>();
  for (const n of nodes) byP.set(n.partner, [...(byP.get(n.partner) || []), n]);
  const peopleNodes: { partner: string; people: number; families: Set<string> }[] = [];
  for (const [partner, arr] of byP) {
    const fams = new Set<string>();
    arr.forEach((x) => x.families.forEach((f) => fams.add(f)));
    peopleNodes.push({ partner, people: Math.max(...arr.map((x) => x.people)), families: fams });
  }
  peopleNodes.sort((a, b) => b.people - a.people);
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
    return {
      id: `x${index + 1}`,
      canonical,
      family: String(exact?.family || "").toLowerCase(),
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

function card(rows: Hit[], pick: "top" | "tight") {
  if (!rows.length) return null;
  const sorted = [...rows].sort((a, b) => (pick === "top" ? b.volume - a.volume : a.volume - b.volume));
  const r = sorted[0];
  return {
    audience_signal: r.signal, sector: r.sector, layer: r.layer,
    partner_sources: r.partner_name, klass: r.cls, scale: Math.round(r.volume),
  };
}

/* --------------------------------- plan --------------------------------- */
type Baseline = { people_reach?: number; actual_people?: number; intent_people?: number } | null;

async function plan(sb: SupabaseClient, ir: IR, baseline: Baseline = null, evidence: "actual" | "intent" | null = null) {
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

  const scored: {
    anchor: Anchor; hits: Hit[]; contextHits: Hit[]; actual: number; intent: number; isPlatform: boolean; ids: string[];
  }[] = [];

  for (const a of anchors) {
    const others = PLATFORM_RE.test(a.canonical) ? productFamilies : [];
    const m = await matchAnchor(sb, a, mods, others);
    const { contextHits, isPlatform, scale } = m;
    // Score the complete anchor once. Evidence is selected only after Boolean algebra,
    // so purchase-backed and interest-backed remain mutually exclusive partitions.
    const hits = m.hits;
    // Every downstream metric uses the same post-modifier list shown in the table.
    // contextHits are retained only for diagnostics and must never enter scoring or slicing.
    const ids = [...new Set(hits.map((h) => h.master_signal_id))];
    const shareMap = await sliceShares(sb, ids, geos, ages, genders, above);
    const actualRows = hits.filter((h) => h.cls === "actual");
    const intentRows = hits.filter((h) => h.cls === "intent");

    let actual = await unionPeople(sb, actualRows, shareMap, ir.mode);
    const intent = await unionPeople(sb, intentRows, shareMap, ir.mode);

    if (isPlatform && !others.length) {
      actual = await platformUniverse(sb, geos, ages, genders, above);
    }
    if (isPlatform) {
      const capAll = await platformUniverse(sb, geos, ages, genders, above);
      actual = Math.min(actual, capAll);
    }
    actual *= scale;
    scored.push({ anchor: a, hits, contextHits, actual, intent: intent * scale, isPlatform, ids });
  }

  let people = 0;
  let actualPeople = 0;
  let intentPeople = 0;
  if (!scored.length) {
    people = 0;
  } else {
    const pop = await popSlice(sb, [], [], [], null);
    people = scored[0].actual + scored[0].intent;
    actualPeople = scored[0].actual;
    let family = scored[0].anchor.family;
    for (const current of scored.slice(1)) {
      const rho = await pairRho(sb, family, current.anchor.family);
      const total = current.actual + current.intent;
      if (ir.join === "AND") {
        people = boundedIntersection(people, total, pop, rho);
        actualPeople = boundedIntersection(actualPeople, current.actual, pop, rho);
      } else {
        people = boundedUnion(people, total, pop, rho);
        actualPeople = boundedUnion(actualPeople, current.actual, pop, rho);
      }
      family = current.anchor.family;
    }

    for (const excluded of await exclusionAnchors(sb, ir.exclusions || [])) {
      const matched = await matchAnchor(sb, excluded, [], []);
      const ids = [...new Set(matched.hits.map((hit) => hit.master_signal_id))];
      const shares = await sliceShares(sb, ids, geos, ages, genders, above);
      const excludedActual = await unionPeople(sb, matched.hits.filter((hit) => hit.cls === "actual"), shares, ir.mode);
      const excludedIntent = await unionPeople(sb, matched.hits.filter((hit) => hit.cls === "intent"), shares, ir.mode);
      const rho = await pairRho(sb, family, excluded.family);
      people = subtractAudience(people, excludedActual + excludedIntent, pop, rho);
      actualPeople = subtractAudience(actualPeople, excludedActual, pop, rho);
    }
    const parts = reconcileReach(people, actualPeople);
    people = parts.total;
    actualPeople = parts.actual;
    intentPeople = parts.intent;
  }

  const allHits = scored.flatMap((s) => s.hits).filter((hit) => !evidence || hit.cls === evidence);
  const allIds = [...new Set(allHits.map((h) => h.master_signal_id))];
  const volOf: Record<string, number> = {};
  for (const h of allHits) volOf[h.master_signal_id] = Number(h.volume || 0) * Number(h.reliability || 1);
  const mix = await splits(sb, allIds, geos, ages, genders, above, volOf);
  // Share of the audience that survives the filter, measured once on the cube.
  const filtered = !!(geos.length || ages.length || genders.length || above != null);
  const mixAll = filtered ? await splits(sb, allIds, [], [], [], null, volOf) : mix;
  const keepShare = filtered && mixAll.total > 0 ? Math.min(1, mix.total / mixAll.total) : 1;
  const cap = await popSlice(sb, geos, ages, genders, above);
  let peopleCapped = Math.max(0, Math.min(people, cap));


  const perAnchor = Math.max(6, Math.floor(25 / Math.max(1, scored.length)));
  const picked: Hit[] = [];
  const pickedIds = new Set<string>();
  for (const s of scored) {
    const list = [...s.hits].sort((a, b) => b.volume - a.volume);
    let n = 0;
    for (const r of list) {
      if (pickedIds.has(r.master_signal_id)) continue;
      picked.push(r); pickedIds.add(r.master_signal_id);
      if (++n >= perAnchor) break;
    }
  }
  for (const r of [...allHits].sort((a, b) => b.volume - a.volume)) {
    if (picked.length >= 25) break;
    if (pickedIds.has(r.master_signal_id)) continue;
    picked.push(r); pickedIds.add(r.master_signal_id);
  }
  const matched = picked
    .sort((a, b) => b.volume - a.volume)
    .map((r) => ({
      audience_signal: r.signal,
      sector: r.sector,
      layer: r.layer,
      partner_sources: r.partner_name,
      klass: r.cls === "actual" ? "Actual" : "Intent",
      scale: Math.round(r.volume * Number(r.reliability || 1)),
      master_signal_id: r.master_signal_id,
    }));

  const primaryRows = scored[0]?.hits.filter((h) => h.cls === "actual") || [];
  const primary = card(primaryRows.length ? primaryRows : scored[0]?.hits || [], "top");
  const expansionRows = scored[1]?.hits || (scored[0]?.hits.filter((h) => h.cls === "intent") ?? []);
  const expansion = card(expansionRows, "top");
  const modTokens = mods.map((m) => squash(m.token));
  const precisionRows = allHits.filter((h) => modTokens.some((t) => t && squash(`${h.signal} ${h.sub_category}`).includes(t)));
  const precision = card(precisionRows.length ? precisionRows : allHits.filter((h) => h.reliability >= 0.7), "tight");

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

  let selected = selectEvidence(reconcileReach(peopleCapped, actualPeople), evidence);
  peopleCapped = selected.total;
  actualPeople = selected.actual;
  intentPeople = selected.intent;

  // Invariant: a narrowed audience can never exceed the unfiltered one.
  if (baseline && Number(baseline.people_reach) > 0) {
    // Filtering is a restriction of the unfiltered audience by its cube share, so the
    // parts always add back up to the whole.
    const baselineReach = evidence === "actual"
      ? Number(baseline.actual_people || 0)
      : evidence === "intent"
      ? Number(baseline.intent_people || 0)
      : Number(baseline.people_reach);
    const capTotal = baselineReach * keepShare;
    if (filtered && capTotal > 0) {
      const k0 = capTotal / (peopleCapped || capTotal);
      peopleCapped = capTotal;
      actualPeople *= k0;
      intentPeople *= k0;
    }
    if (peopleCapped > capTotal) {
      const k = capTotal / peopleCapped;
      peopleCapped = capTotal;
      actualPeople *= k;
      intentPeople *= k;
    }
    if (!evidence && Number(baseline.actual_people) >= 0) actualPeople = Math.min(actualPeople, Number(baseline.actual_people));
    if (!evidence && Number(baseline.intent_people) >= 0) intentPeople = Math.min(intentPeople, Number(baseline.intent_people));
  }

  selected = selectEvidence(reconcileReach(peopleCapped, actualPeople), evidence);
  peopleCapped = selected.total;
  actualPeople = selected.actual;
  intentPeople = selected.intent;

  const geo_split = Object.entries(mix.geo).map(([k, sh]) => ({ geo_tier: k, volume: Math.round(peopleCapped * sh), share: round4(sh) }));
  const age_split = Object.entries(mix.age).map(([k, sh]) => ({ age_bucket: k, volume: Math.round(peopleCapped * sh), share: round4(sh) }));
  const gender_split = Object.entries(mix.gen).map(([k, sh]) => ({ gender_bucket: k, volume: Math.round(peopleCapped * sh), share: round4(sh) }));

  return {
    query_ir: ir,
    base_cohort: anchors.map((a) => title(a.canonical)).join(` ${ir.join} `) || "—",
    modifier_line: modLine,
    dimension_line: dimBits.length ? dimBits.join(" · ") : "none",
    evidence,
    people_reach: Math.round(peopleCapped),
    actual_people: Math.round(actualPeople),
    intent_people: Math.round(intentPeople),
    india_intelligence: Math.round(peopleCapped),
    identifier_reach: Math.round(peopleCapped),
    planning_confidence: allHits.some((r) => r.reliability >= 0.7) ? "High" : "Medium",
    matched_signals: matched,
    primary_audience: primary,
    expansion_audience: expansion,
    precision_audience: precision,
    geo_split, age_split, gender_split,
    partners: [...new Set(allHits.map((h) => h.partner_name))],
    session: {
      matched_ids: allIds.slice(0, 400),
      anchors: anchors.map((a) => a.canonical),
      join: ir.join,
    },
    how_built: {
      join: ir.join,
      anchors: anchors.map((a) => a.canonical),
      modifiers: mods,
      rules: [
        "Built from relevant partner audience signals",
        "Each qualifier is applied to the audience it describes",
        ir.join === "AND" ? "Includes people who meet every selected audience condition" : "Includes people who meet any selected audience condition",
        "Presented as a unified addressable audience",
      ],
    },
  };
}

function title(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
