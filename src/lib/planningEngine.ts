import dataset from "@/data/planningDataset.json";

/* ===================== types ===================== */
export type Row = {
  partner: string;
  category: string;
  sub: string;
  signal: string;
  volume: number;
  geo: number[];
  age: number[];
  gender: number[];
  text: string;
  sector: string;
  layer: string;
  key: string;
};

export type Group = {
  key: string;
  label: string;
  sector: string;
  layer: string;
  partners: string[];
  volume: number;
};

export type Split = { label: string; value: number; pct: number };

export type PlanResult = {
  title: string;
  total: number;
  confidence: "High" | "Medium" | "Low";
  groups: Group[];
  allGroups: Group[];
  partners: string[];
  geo: Split[];
  age: Split[];
  gender: Split[];
  notes: string;
};

export type Filters = { geo_tier?: string; age_bucket?: string; gender?: string };

export type Block = {
  id: string;
  core_category: string;
  intent?: string;
  modifiers: string[];
  filters: Filters;
};

export type BlockNode = { id: string; type: "BLOCK"; block: Block };
export type GroupNode = {
  id: string;
  type: "GROUP";
  operator: "AND" | "OR" | "EXCLUDE";
  children: Expression[];
  group_modifiers: string[];
  filters: Filters;
};
export type Expression = BlockNode | GroupNode;

/* ===================== mappings ===================== */
export const GEOS: string[] = (dataset as any).geos;
export const AGES: string[] = (dataset as any).ages;
export const GENDERS: string[] = (dataset as any).genders;

const SECTORS: Record<string, string[]> = {
  "Fashion & Beauty": ["beauty", "skincare", "skin care", "cosmetic", "cosmetics", "makeup", "personal care", "grooming", "fashion", "apparel", "clothing", "footwear", "jewellery", "jewelry", "salon", "fragrance", "hair care"],
  BFSI: ["bank", "banking", "finance", "financial", "credit", "debit", "loan", "insurance", "card", "upi", "payment", "payments", "wallet", "emi", "investment", "mutual fund", "trading", "transaction", "pos"],
  Auto: ["auto", "car", "cars", "suv", "sedan", "hatchback", "2w", "4w", "two wheeler", "four wheeler", "bike", "motorcycle", "scooter", "ev", "electric vehicle", "vehicle"],
  "CPG / FMCG": ["grocery", "snack", "snacks", "food", "beverage", "beverages", "dairy", "biscuit", "biscuits", "chips", "chocolate", "masala", "packaged food", "q-commerce", "quick commerce", "fruits", "vegetables", "atta", "tea", "coffee"],
  "Travel & Hospitality": ["travel", "traveller", "travellers", "travelers", "flight", "hotel", "holiday", "vacation", "tourism", "resort", "airline", "airport"],
  Education: ["college", "student", "students", "education", "course", "coaching", "exam", "mba", "engineering", "university", "edtech", "learning"],
  "Consumer Electronics": ["mobile", "smartphone", "handset", "phone", "device", "laptop", "electronics", "gadget", "tablet", "android", "ios", "5g", "appliance"],
  "Digital & Apps": ["app", "apps", "gaming", "ott", "music", "streaming", "social", "digital", "internet", "online"],
};

const LAYERS: Record<string, string[]> = {
  Demographics: ["age", "gender", "male", "female", "student", "family", "parent", "children", "kids", "senior", "working professional", "demographic"],
  Affluence: ["premium", "affluent", "high value", "high-value", "luxury", "income", "spend", "spender", "high ticket", "credit card", "elite", "platinum", "signature"],
  Commerce: ["buyer", "buyers", "purchase", "purchased", "shopper", "shopping", "grocery", "basket", "transaction", "retail", "q-commerce", "quick commerce", "order"],
  Intent: ["intent", "intender", "interested", "looking for", "search", "researching", "planning to buy", "in-market", "rfq", "enquiry"],
  "Digital & App": ["app", "online", "digital", "gaming", "ott", "streaming", "social", "mobile internet", "upi"],
  "Location & Mobility": ["metro", "tier", "city", "commute", "travel", "airport", "location", "mobility", "region"],
  "Device & Connectivity": ["mobile", "smartphone", "handset", "device", "android", "ios", "5g", "network"],
  Lifestyle: ["interest", "affinity", "lifestyle", "fitness", "sports", "movie", "music", "entertainment", "pet", "home"],
};

/* core categories: mandatory eligibility */
export const CORE_CATEGORIES: Record<string, { keywords: string[]; sector: string; normalized: string }> = {
  "Beauty / Skincare": { sector: "Fashion & Beauty", normalized: "beauty_skincare", keywords: ["skincare", "skin care", "skin", "beauty", "cosmetic", "cosmetics", "makeup", "personal care", "grooming", "fragrance", "salon", "hair care"] },
  "Fashion & Apparel": { sector: "Fashion & Beauty", normalized: "fashion_apparel", keywords: ["fashion", "apparel", "clothing", "footwear", "shoes", "jewellery", "jewelry", "watch", "ethnic wear"] },
  "SUV / Auto": { sector: "Auto", normalized: "auto_4w_suv", keywords: ["suv", "car", "cars", "4w", "four wheeler", "vehicle", "auto", "ev", "electric vehicle", "sedan", "hatchback"] },
  "Two Wheeler": { sector: "Auto", normalized: "auto_2w", keywords: ["bike", "motorcycle", "scooter", "2w", "two wheeler"] },
  "Grocery / Quick Commerce": { sector: "CPG / FMCG", normalized: "grocery_qcommerce", keywords: ["grocery", "q-commerce", "quick commerce", "basket", "kirana", "staples", "atta", "rice", "vegetables", "fruits"] },
  "Snacks & Packaged Food": { sector: "CPG / FMCG", normalized: "cpg_snacks_food", keywords: ["snack", "snacks", "chips", "biscuit", "biscuits", "chocolate", "food", "beverage", "packaged food", "dairy", "juice", "tea", "coffee", "namkeen"] },
  "Finance / Credit": { sector: "BFSI", normalized: "bfsi_credit_finance", keywords: ["finance", "financial", "banking", "bank", "credit", "loan", "emi", "investment", "mutual fund", "trading", "insurance"] },
  "Payments / UPI": { sector: "BFSI", normalized: "payment_migration", keywords: ["upi", "payment", "payments", "wallet", "cod", "cash", "debit", "atm", "pos", "transaction", "card"] },
  "Travel": { sector: "Travel & Hospitality", normalized: "travel_hospitality", keywords: ["travel", "traveller", "traveler", "hotel", "flight", "holiday", "vacation", "tourism", "airport", "airline", "resort", "trip"] },
  "College Students": { sector: "Education", normalized: "education_students", keywords: ["college", "student", "students", "university", "campus", "education", "exam", "course", "mba", "engineering", "coaching"] },
  "Devices & Electronics": { sector: "Consumer Electronics", normalized: "device_electronics", keywords: ["mobile", "smartphone", "handset", "phone", "laptop", "electronics", "gadget", "tablet", "appliance", "5g"] },
  "Digital & Apps": { sector: "Digital & Apps", normalized: "digital_apps", keywords: ["app", "apps", "gaming", "ott", "streaming", "music", "social", "online", "digital", "internet"] },
  "Home & Living": { sector: "Cross-Sector", normalized: "home_living", keywords: ["home", "furniture", "kitchen", "decor", "appliance", "household"] },
  "Business / B2B": { sector: "Cross-Sector", normalized: "b2b_business", keywords: ["business", "b2b", "supplier", "manufacturer", "industrial", "wholesale", "machinery", "enquiry", "rfq"] },
};

export const CORE_LIST = Object.keys(CORE_CATEGORIES);
export const SECTOR_LIST = Array.from(new Set(Object.values(CORE_CATEGORIES).map((c) => c.sector)));
export const INTENTS = ["buyer", "intender", "shopper", "user", "interest", "traveller", "student"];
export const MODIFIERS = ["premium", "affluent", "luxury", "high value", "value seeking", "frequent", "new"];

const BANNED_SOLO = new Set(["premium", "affluent", "luxury", "high", "value", "buyer", "buyers", "shopper", "shoppers", "user", "users", "audience", "audiences", "intender", "intenders", "male", "female", "men", "women", "metro", "tier", "age", "band", "cohort", "people", "customers"]);
const PREMIUM_WORDS = ["premium", "affluent", "luxury", "high value", "high-value", "high spender", "elite", "platinum", "signature", "high ticket", "spend"];
const STOP = new Set(["the", "of", "in", "for", "a", "an", "and", "with", "to", "last", "days", "total", "active", "who", "are"]);

/* ===================== helpers ===================== */
export const clean = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
const tokens = (s: string) => clean(s).split(" ").filter((w) => w.length > 2 && !STOP.has(w));

export const fmt = (n: number) => {
  if (!isFinite(n) || n <= 0) return "0";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "Bn";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return Math.round(n).toLocaleString();
};

/* word-boundary / phrase matching — substring matching caused card→car, beverage→ev, apparel→app bleed */
const kwCache = new Map<string, RegExp>();
const kwRe = (k: string) => {
  let re = kwCache.get(k);
  if (!re) {
    const esc = k.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    re = new RegExp(`(^|[^a-z0-9])${esc}(s|es)?([^a-z0-9]|$)`);
    kwCache.set(k, re);
  }
  return re;
};
export const hasKw = (text: string, k: string) => kwRe(k).test(text);

function classify(map: Record<string, string[]>, text: string, fallback: string) {
  let best = fallback;
  let score = 0;
  for (const [name, kws] of Object.entries(map)) {
    let s = 0;
    for (const k of kws) if (hasKw(text, k)) s += k.length > 5 ? 2 : 1;
    if (s > score) {
      score = s;
      best = name;
    }
  }
  return best;
}

function coreOf(text: string) {
  let best = "";
  let score = 0;
  for (const [name, c] of Object.entries(CORE_CATEGORIES)) {
    let s = 0;
    for (const k of c.keywords) if (hasKw(text, k)) s += k.length > 5 ? 2 : 1;
    if (s > score) {
      score = s;
      best = name;
    }
  }
  return best;
}


function buildRow(partner: string, category: string, sub: string, signal: string, volume: number, geo: number[], age: number[], gender: number[]): Row {
  const text = clean(`${partner} ${category} ${sub} ${signal}`);
  const sector = classify(SECTORS, text, "Cross-Sector");
  const layer = classify(LAYERS, text, "Cross-Sector Consumer Signals");
  const core = coreOf(text);
  const normalized = core ? CORE_CATEGORIES[core].normalized : "cross_sector";
  const cleanedSignal = tokens(signal).slice(0, 5).sort().join("_");
  return { partner, category, sub, signal, volume, geo, age, gender, text, sector, layer, key: `${normalized}|${sector}|${layer}|${cleanedSignal}` };
}

/* ===================== dataset ===================== */
let cached: Row[] | null = null;
export function getBundledRows(): Row[] {
  if (cached) return cached;
  const d = dataset as any;
  cached = (d.rows as any[]).map((r) => buildRow(d.partners[r[0]], r[1], r[2], r[3], r[4], r[5], r[6], r[7]));
  return cached;
}

export function datasetStats(rows: Row[]) {
  const partners = new Map<string, { signals: number; volume: number }>();
  let vol = 0;
  for (const r of rows) {
    const p = partners.get(r.partner) || { signals: 0, volume: 0 };
    p.signals += 1;
    p.volume += r.volume;
    partners.set(r.partner, p);
    vol += r.volume;
  }
  return {
    rows: rows.length,
    signals: new Set(rows.map((r) => r.signal)).size,
    partners: partners.size,
    tiers: GEOS.length,
    vol,
    partnerList: Array.from(partners.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.volume - a.volume),
  };
}

/* CSV upload path — aggregates to the same signal-level shape */
export function parseCSV(text: string): Row[] {
  const lines = text.split(/\r?\n/);
  const header = (lines[0] || "").replace(/^\uFEFF/, "").split(",").map((h) => h.trim().toLowerCase());
  const pick = (names: string[]) => {
    for (const n of names) {
      const i = header.indexOf(n);
      if (i >= 0) return i;
    }
    return -1;
  };
  const iP = pick(["partner_name", "partner", "source_partner"]);
  const iC = pick(["category", "raw_category"]);
  const iS = pick(["sub_category", "raw_sub_category", "subcategory"]);
  const iSig = pick(["signal", "raw_signal", "audience_name", "cohort_name", "attribute"]);
  const iG = pick(["geo_tier", "tier", "city_tier"]);
  const iA = pick(["age_bucket", "age", "age_band"]);
  const iGen = pick(["gender_bucket", "gender"]);
  const iV = pick(["volume", "final_volume", "audience_volume", "source_volume"]);

  const agg = new Map<string, { p: string; c: string; s: string; n: string; v: number; g: number[]; a: number[]; x: number[] }>();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const c = line.split(",");
    const partner = (c[iP] || "").trim() || "Unknown Partner";
    const category = (c[iC] || "").trim();
    const sub = (c[iS] || "").trim();
    const signal = (c[iSig] || "").trim() || category || "Audience Signal";
    const volume = Number(String(c[iV] ?? "").replace(/[",]/g, "")) || 0;
    const k = `${partner}|${category}|${sub}|${signal}`;
    let e = agg.get(k);
    if (!e) {
      e = { p: partner, c: category, s: sub, n: signal, v: 0, g: GEOS.map(() => 0), a: AGES.map(() => 0), x: GENDERS.map(() => 0) };
      agg.set(k, e);
    }
    e.v += volume;
    const gi = GEOS.indexOf((c[iG] || "").trim());
    if (gi >= 0) e.g[gi] += volume;
    const ai = AGES.indexOf((c[iA] || "").trim());
    if (ai >= 0) e.a[ai] += volume;
    const xi = GENDERS.indexOf((c[iGen] || "").trim());
    if (xi >= 0) e.x[xi] += volume;
  }
  return Array.from(agg.values()).map((e) => {
    const t = e.v || 1;
    return buildRow(e.p, e.c, e.s, e.n, e.v, e.g.map((x) => x / t), e.a.map((x) => x / t), e.x.map((x) => x / t));
  });
}

/* ===================== neutral planning distribution ===================== */
const NEUTRAL_GEO: Record<string, number> = { Metro: 0.35, "Tier 1": 0.25, "Tier 2": 0.25, "Tier 3": 0.15 };
const NEUTRAL_AGE: Record<string, number> = { "Less than 22": 0.12, "23-28": 0.22, "29-34": 0.22, "35-40": 0.16, "41-46": 0.12, "47-52": 0.09, "52+": 0.07, Others: 0 };
const NEUTRAL_GENDER: Record<string, number> = { Male: 0.52, Female: 0.48, Others: 0 };

const neutralArr = (labels: string[], map: Record<string, number>) => {
  const v = labels.map((l) => map[l] ?? 0);
  const s = v.reduce((a, b) => a + b, 0) || 1;
  return v.map((x) => x / s);
};
const NG = neutralArr(GEOS, NEUTRAL_GEO);
const NA = neutralArr(AGES, NEUTRAL_AGE);
const NX = neutralArr(GENDERS, NEUTRAL_GENDER);

function distOf(r: Row) {
  // Zepto rows carry genuine partner-level distribution; other partners are rebuilt on a neutral planning distribution
  if (/zepto/i.test(r.partner)) return { g: r.geo, a: r.age, x: r.gender };
  return { g: NG, a: NA, x: NX };
}

/* ===================== query parsing ===================== */
export function parseQueryToBlocks(qRaw: string): { blocks: Block[]; operator: "AND" | "OR" | "EXCLUDE"; premium: boolean } {
  const q = clean(qRaw);
  const premium = PREMIUM_WORDS.some((w) => q.includes(w));
  const filters: Filters = {};
  if (/female|women|woman|girls/.test(q)) filters.gender = "Female";
  else if (/\bmale\b|\bmen\b|\bman\b|boys/.test(q)) filters.gender = "Male";
  if (/metro/.test(q)) filters.geo_tier = "Metro";
  else if (/tier\s*-?\s*1/.test(q)) filters.geo_tier = "Tier 1";
  else if (/tier\s*-?\s*2/.test(q)) filters.geo_tier = "Tier 2";
  else if (/tier\s*-?\s*3/.test(q)) filters.geo_tier = "Tier 3";
  const am = q.match(/(\d{2})\s*[-to]+\s*(\d{2})/);
  if (am) {
    const start = Number(am[1]);
    const bucket = AGES.find((a) => {
      const m = a.match(/(\d+)/);
      return m && Math.abs(Number(m[1]) - start) <= 3;
    });
    if (bucket) filters.age_bucket = bucket;
  }

  // detect core categories mentioned
  const found: string[] = [];
  for (const [name, c] of Object.entries(CORE_CATEGORIES)) {
    if (c.keywords.some((k) => new RegExp(`(^|\\s)${k.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}`).test(q))) found.push(name);
  }
  const operator: "AND" | "OR" | "EXCLUDE" = /\bexclude|not |except|without\b/.test(q) ? "EXCLUDE" : /\bor\b/.test(q) ? "OR" : "AND";
  const modifiers = PREMIUM_WORDS.filter((w) => q.includes(w));
  const blocks: Block[] = found.slice(0, 3).map((core, i) => ({ id: `q${i}`, core_category: core, modifiers, filters }));
  if (!blocks.length) {
    // fall back to free-text keywords that are not banned-solo
    const kws = tokens(q).filter((w) => !BANNED_SOLO.has(w));
    if (kws.length) blocks.push({ id: "q0", core_category: `__free:${kws.join(" ")}`, modifiers, filters });
  }
  return { blocks, operator, premium };
}

/* ===================== block evaluation ===================== */
type Eval = { total: number; rows: { r: Row; v: number; score: number }[]; sector: string; core: string };

function keywordsFor(core: string) {
  if (core.startsWith("__free:")) return { kws: core.slice(7).split(" "), sector: "Cross-Sector" };
  const c = CORE_CATEGORIES[core];
  return { kws: c.keywords, sector: c.sector };
}

function evalBlock(rows: Row[], block: Block, extraModifiers: string[] = [], extraFilters: Filters = {}): Eval {
  const { kws, sector } = keywordsFor(block.core_category);
  const modifiers = Array.from(new Set([...block.modifiers, ...extraModifiers]));
  const filters = { ...extraFilters, ...block.filters };
  const isPremium = modifiers.some((m) => PREMIUM_WORDS.includes(m) || /premium|affluent|luxury|high value/.test(m));

  const eligible: { r: Row; score: number; hasMod: boolean }[] = [];
  for (const r of rows) {
    let s = 0;
    for (const k of kws) {
      if (r.text.includes(k)) s += k.length > 5 ? 3 : 2;
    }
    if (s === 0) continue;
    if (sector !== "Cross-Sector" && r.sector === sector) s += 3;
    if (block.intent && r.text.includes(block.intent)) s += 2;
    const hasMod = PREMIUM_WORDS.some((w) => r.text.includes(w));
    if (isPremium && hasMod) s += 4;
    eligible.push({ r, score: s, hasMod });
  }
  if (!eligible.length) return { total: 0, rows: [], sector, core: block.core_category };

  let selected = eligible;
  let narrowing = 1;
  if (isPremium) {
    const mod = eligible.filter((e) => e.hasMod);
    if (mod.length) {
      const broad = eligible.filter((e) => !e.hasMod).map((e) => ({ ...e, weight: 0.2 }));
      selected = [...mod.map((e) => ({ ...e, weight: 1 })), ...broad] as any;
    } else {
      narrowing = 0.35;
    }
  }

  const out: { r: Row; v: number; score: number }[] = [];
  let total = 0;
  // group rows by cohort key to apply duplicate/partner contribution rules
  const groups = new Map<string, { r: Row; score: number; weight: number }[]>();
  for (const e of selected as any[]) {
    const arr = groups.get(e.r.key) || [];
    arr.push({ r: e.r, score: e.score, weight: e.weight ?? 1 });
    groups.set(e.r.key, arr);
  }
  for (const arr of groups.values()) {
    // max per partner
    const byPartner = new Map<string, { r: Row; score: number; weight: number }>();
    for (const e of arr) {
      const prev = byPartner.get(e.r.partner);
      if (!prev || e.r.volume > prev.r.volume) byPartner.set(e.r.partner, e);
    }
    const list = Array.from(byPartner.values()).sort((a, b) => b.r.volume - a.r.volume);
    list.forEach((e, i) => {
      const contribution = i === 0 ? 1 : e.r.layer === list[0].r.layer ? 0.4 : 0.25;
      const d = distOf(e.r);
      let v = e.r.volume * contribution * e.weight * narrowing;
      if (filters.geo_tier) v *= d.g[GEOS.indexOf(filters.geo_tier)] ?? 0;
      if (filters.age_bucket) v *= d.a[AGES.indexOf(filters.age_bucket)] ?? 0;
      if (filters.gender) v *= d.x[GENDERS.indexOf(filters.gender)] ?? 0;
      if (v <= 0) return;
      out.push({ r: e.r, v, score: e.score });
      total += v;
    });
  }
  return { total, rows: out, sector, core: block.core_category };
}

const sectorOf = (core: string) => (core.startsWith("__free:") ? "Cross-Sector" : CORE_CATEGORIES[core]?.sector || "Cross-Sector");

function combine(evals: Eval[], operator: "AND" | "OR" | "EXCLUDE"): Eval {
  if (evals.length === 1) return evals[0];
  const merged: Eval = { total: 0, rows: evals.flatMap((e) => e.rows), sector: evals[0]?.sector || "Cross-Sector", core: evals.map((e) => e.core).join(" / ") };
  const totals = evals.map((e) => e.total);
  const sameSector = new Set(evals.map((e) => e.sector)).size === 1;
  if (operator === "AND") {
    const factor = sameSector ? 0.25 : 0.15;
    merged.total = Math.min(...totals) * factor;
  } else if (operator === "OR") {
    const sorted = [...totals].sort((a, b) => b - a);
    const overlapPct = sameSector ? 0.4 : 0.15;
    merged.total = sorted.reduce((a, b, i) => a + (i === 0 ? b : b * (1 - overlapPct)), 0);
  } else {
    const base = totals[0];
    const excl = totals.slice(1).reduce((a, b) => a + b, 0);
    const overlapPct = sameSector ? 0.3 : 0.1;
    merged.total = Math.max(0, base - Math.min(base, excl) * overlapPct);
    merged.rows = evals[0].rows;
  }
  return merged;
}

/* ===================== result assembly ===================== */
function assemble(title: string, ev: Eval, notes: string): PlanResult {
  const groups = new Map<string, Group & { raw: number }>();
  const gSplit = GEOS.map(() => 0);
  const aSplit = AGES.map(() => 0);
  const xSplit = GENDERS.map(() => 0);

  let rowTotal = 0;
  for (const { r, v } of ev.rows) {
    rowTotal += v;
    let g = groups.get(r.key);
    if (!g) {
      g = { key: r.key, label: r.signal.replace(/\s*-\s*Last \d+ Days?/i, "").trim(), sector: r.sector, layer: r.layer, partners: [], volume: 0, raw: 0 };
      groups.set(r.key, g);
    }
    if (!g.partners.includes(r.partner)) g.partners.push(r.partner);
    g.raw += v;
    const d = distOf(r);
    for (let i = 0; i < GEOS.length; i++) gSplit[i] += v * d.g[i];
    for (let i = 0; i < AGES.length; i++) aSplit[i] += v * d.a[i];
    for (let i = 0; i < GENDERS.length; i++) xSplit[i] += v * d.x[i];
  }

  const scale = rowTotal > 0 ? ev.total / rowTotal : 0;
  const list = Array.from(groups.values())
    .map((g) => ({ key: g.key, label: g.label, sector: g.sector, layer: g.layer, partners: g.partners, volume: g.raw * scale }))
    .sort((a, b) => b.volume - a.volume);

  const partners = Array.from(new Set(list.flatMap((g) => g.partners)));
  const toSplit = (arr: number[], labels: string[]): Split[] => {
    const sum = arr.reduce((a, b) => a + b, 0) || 1;
    return labels
      .map((l, i) => ({ label: l, value: (arr[i] / sum) * ev.total, pct: (arr[i] / sum) * 100 }))
      .filter((s) => s.pct > 0.2)
      .sort((a, b) => b.value - a.value);
  };

  const confidence: PlanResult["confidence"] = list.length >= 12 && partners.length >= 3 ? "High" : list.length >= 3 || partners.length >= 2 ? "Medium" : "Low";

  return {
    title,
    total: ev.total,
    confidence,
    groups: list.slice(0, 8),
    allGroups: list,
    partners,
    geo: toSplit(gSplit, GEOS),
    age: toSplit(aSplit, AGES),
    gender: toSplit(xSplit, GENDERS),
    notes,
  };
}

/* ===================== public API ===================== */
export function runSearch(rows: Row[], qRaw: string): PlanResult {
  const { blocks, operator, premium } = parseQueryToBlocks(qRaw);
  const evals = blocks.map((b) => evalBlock(rows, b));
  const ev = combine(evals.filter((e) => e.total > 0).length ? evals : evals, operator);
  const notes = `Matched relevant partner audience signals across ${new Set(evals.map((e) => e.sector)).size} planning sector(s), grouped similar cohort meanings and applied planning-grade geo, age and gender cuts.${premium ? " Premium and high-value indicators were prioritised." : ""}`;
  return assemble(qRaw.trim().replace(/\b\w/g, (c) => c.toUpperCase()), ev, notes);
}

export function evaluateExpression(rows: Row[], expr: Expression, inheritedModifiers: string[] = [], inheritedFilters: Filters = {}): Eval {
  if (expr.type === "BLOCK") return evalBlock(rows, expr.block, inheritedModifiers, inheritedFilters);
  const mods = [...inheritedModifiers, ...expr.group_modifiers];
  const filters = { ...inheritedFilters, ...expr.filters };
  const children = expr.children.map((c) => evaluateExpression(rows, c, mods, filters));
  return combine(children.length ? children : [{ total: 0, rows: [], sector: "Cross-Sector", core: "" }], expr.operator);
}

export function runBuild(rows: Row[], expr: Expression, title: string): PlanResult {
  const ev = evaluateExpression(rows, expr);
  return assemble(title, ev, "Built from selected audience blocks with planning-grade overlap and contribution rules applied across partner sources.");
}

export { sectorOf };
