import { useMemo, useRef, useState } from "react";

/* ---------------- types ---------------- */
type Row = {
  partner: string;
  category: string;
  sub: string;
  signal: string;
  geo: string;
  age: string;
  gender: string;
  volume: number;
  text: string;
  sector: string;
  layer: string;
};

type Group = {
  key: string;
  label: string;
  sector: string;
  layer: string;
  partners: string[];
  volume: number;
  rows: Row[];
};

/* ---------------- mappings ---------------- */
const SECTORS: Record<string, string[]> = {
  "Fashion & Beauty": ["beauty", "skincare", "skin care", "cosmetic", "cosmetics", "makeup", "personal care", "grooming", "fashion", "apparel", "clothing", "shoes", "footwear", "jewellery", "jewelry", "salon", "fragrance", "hair care", "bath"],
  BFSI: ["bank", "banking", "finance", "financial", "credit", "debit", "loan", "insurance", "card", "upi", "payment", "payments", "wallet", "emi", "investment", "mutual fund", "trading", "transaction", "pos", "razorpay", "pinelabs"],
  Auto: ["auto", "car", "cars", "suv", "sedan", "hatchback", "2w", "4w", "two wheeler", "four wheeler", "bike", "motorcycle", "scooter", "ev", "electric vehicle", "vehicle"],
  "CPG / FMCG": ["grocery", "snack", "snacks", "munchie", "munchies", "food", "beverage", "beverages", "cold drink", "juices", "dairy", "biscuit", "biscuits", "chips", "chocolate", "masala", "packaged food", "q-commerce", "quick commerce", "zepto", "fruits", "vegetables", "atta", "rice", "sweet", "frozen", "tea", "coffee", "protein"],
  "Travel & Hospitality": ["travel", "traveller", "travellers", "travelers", "flight", "hotel", "holiday", "vacation", "tourism", "resort", "airline", "train", "bus", "commute", "airport"],
  Education: ["college", "student", "students", "education", "course", "coaching", "exam", "mba", "engineering", "university", "edtech", "learning", "collegedunia"],
  "Consumer Electronics": ["mobile", "smartphone", "handset", "phone", "device", "laptop", "electronics", "gadget", "tablet", "android", "ios", "5g", "appliance", "appliances"],
  "Digital & Apps": ["app", "apps", "gaming", "ott", "music", "streaming", "social", "content", "digital", "internet", "online"],
};
const CROSS = ["affluent", "premium", "high value", "high-value", "metro", "urban", "family", "young", "male", "female", "working professional", "shopper", "consumer", "luxury"];

const LAYERS: Record<string, string[]> = {
  Demographics: ["age", "gender", "male", "female", "student", "family", "parent", "children", "kids", "senior", "working professional", "demographic"],
  Affluence: ["premium", "affluent", "high value", "high-value", "luxury", "income", "spend", "spender", "expensive", "high ticket", "credit card", "affluence", "elite", "platinum", "signature"],
  Commerce: ["buyer", "buyers", "purchase", "purchased", "shopper", "shopping", "grocery", "basket", "transaction", "retail", "q-commerce", "quick commerce", "transactor", "order"],
  Intent: ["intent", "intender", "interested", "looking for", "search", "researching", "planning to buy", "in-market", "rfq", "enquiry"],
  "Digital & App": ["app", "online", "digital", "gaming", "ott", "streaming", "social", "mobile internet", "upi", "platform"],
  "Location & Mobility": ["metro", "tier", "city", "commute", "travel", "airport", "location", "mobility", "region", "geography"],
};

const SYNONYMS: Record<string, string> = {
  skincare: "beauty_skincare", "skin care": "beauty_skincare", beauty: "beauty_skincare", cosmetic: "beauty_skincare", makeup: "beauty_skincare", "personal care": "beauty_skincare",
  grocery: "grocery_qcommerce", "q-commerce": "grocery_qcommerce", "quick commerce": "grocery_qcommerce", basket: "grocery_qcommerce", snack: "grocery_qcommerce", snacks: "grocery_qcommerce", munchies: "grocery_qcommerce",
  suv: "auto_4w_suv", car: "auto_4w_suv", "4w": "auto_4w_suv", "four wheeler": "auto_4w_suv",
  loan: "bfsi_credit_finance", credit: "bfsi_credit_finance", finance: "bfsi_credit_finance", banking: "bfsi_credit_finance",
  upi: "digital_payments", payment: "digital_payments", payments: "digital_payments", wallet: "digital_payments",
  college: "education_students", student: "education_students", education: "education_students", course: "education_students",
  traveller: "travel_hospitality", travel: "travel_hospitality", hotel: "travel_hospitality", flight: "travel_hospitality",
};

const STOP = new Set(["users", "user", "audience", "audiences", "segment", "segments", "cohort", "cohorts", "interested", "intenders", "intender", "the", "of", "in", "for", "a", "an", "and", "with", "to", "last", "days", "total", "active"]);
const PREMIUM_WORDS = ["premium", "affluent", "luxury", "high value", "high-value", "high spender", "elite", "platinum", "signature", "high ticket"];

/* ---------------- helpers ---------------- */
const clean = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
const tokens = (s: string) => clean(s).split(" ").filter((w) => w.length > 2 && !STOP.has(w));

function classify(map: Record<string, string[]>, text: string, fallback: string) {
  let best = fallback;
  let score = 0;
  for (const [name, kws] of Object.entries(map)) {
    let s = 0;
    for (const k of kws) if (text.includes(k)) s += k.length > 5 ? 2 : 1;
    if (s > score) {
      score = s;
      best = name;
    }
  }
  return best;
}

const fmt = (n: number) => {
  if (!isFinite(n) || n <= 0) return "0";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "Bn";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return Math.round(n).toLocaleString();
};

function pick(h: string[], names: string[]) {
  for (const n of names) {
    const i = h.indexOf(n);
    if (i >= 0) return i;
  }
  return -1;
}

function parseCSV(text: string): Row[] {
  const lines = text.split(/\r?\n/);
  const header = (lines[0] || "").replace(/^\uFEFF/, "").split(",").map((h) => h.trim().toLowerCase());
  const iP = pick(header, ["partner_name", "partner", "source_partner"]);
  const iC = pick(header, ["category", "raw_category"]);
  const iS = pick(header, ["sub_category", "raw_sub_category", "subcategory"]);
  const iSig = pick(header, ["signal", "raw_signal", "audience_name", "cohort_name", "attribute"]);
  const iG = pick(header, ["geo_tier", "tier", "city_tier"]);
  const iA = pick(header, ["age_bucket", "age", "age_band"]);
  const iGen = pick(header, ["gender_bucket", "gender"]);
  const iV = pick(header, ["volume", "final_volume", "audience_volume", "source_volume"]);
  const out: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const c = line.split(",");
    const partner = (c[iP] || "").trim() || "Unknown Partner";
    const category = (c[iC] || "").trim();
    const sub = (c[iS] || "").trim();
    const signal = (c[iSig] || "").trim() || category || "Audience Signal";
    const geo = (c[iG] || "").trim() || "Unknown";
    const age = (c[iA] || "").trim() || "Unknown Age";
    const gender = (c[iGen] || "").trim() || "Unknown Gender";
    const volume = Number(String(c[iV] ?? "").replace(/[",]/g, "")) || 0;
    const text = clean(`${partner} ${category} ${sub} ${signal}`);
    const sector = (() => {
      let best = "Cross-Sector";
      let sc = 0;
      for (const [name, kws] of Object.entries(SECTORS)) {
        let s = 0;
        for (const k of kws) if (text.includes(k)) s += k.length > 5 ? 2 : 1;
        if (s > sc) {
          sc = s;
          best = name;
        }
      }
      if (sc === 0 && CROSS.some((k) => text.includes(k))) best = "Cross-Sector";
      return best;
    })();
    const layer = classify(LAYERS, text, "Cross-Sector Consumer Signals");
    out.push({ partner, category, sub, signal, geo, age, gender, volume, text, sector, layer });
  }
  return out;
}

/* -------------- query engine -------------- */
function normKey(r: Row) {
  const t = tokens(`${r.signal} ${r.sub}`).map((w) => SYNONYMS[w] || w.replace(/s$/, ""));
  return `${Array.from(new Set(t)).sort().slice(0, 4).join("_")}|${r.sector}|${r.layer}`;
}

const AGE_MAP = [
  { re: /18\s*-?\s*24|less than 22|under 22|gen z|youth|teen/, buckets: ["Less than 22", "23-28"] },
  { re: /25\s*-?\s*34/, buckets: ["23-28", "29-34"] },
  { re: /35\s*-?\s*44/, buckets: ["35-40", "41-46"] },
  { re: /45\+|45 plus|senior/, buckets: ["47-52", "52+"] },
];

function runQuery(rows: Row[], qRaw: string) {
  const q = clean(qRaw);
  const qt = tokens(qRaw);
  const isPremium = PREMIUM_WORDS.some((w) => q.includes(w));
  const gender = /female|women|woman|girls/.test(q) ? "Female" : /\bmale|men\b|man\b|boys/.test(q) ? "Male" : null;
  const geo = /metro/.test(q) ? "Metro" : /tier\s*-?\s*1/.test(q) ? "Tier 1" : /tier\s*-?\s*2/.test(q) ? "Tier 2" : /tier\s*-?\s*3/.test(q) ? "Tier 3" : null;
  let ages: string[] | null = null;
  for (const a of AGE_MAP) if (a.re.test(q)) ages = a.buckets;
  if (/college|student/.test(q)) ages = ["Less than 22", "23-28"];

  const isMigration = /(not|non|exclude|excluding|without|migration)/.test(q);
  const qSector = (() => {
    let best: string | null = null;
    let sc = 0;
    for (const [name, kws] of Object.entries(SECTORS)) {
      let s = 0;
      for (const k of kws) if (q.includes(k)) s += 2;
      if (s > sc) {
        sc = s;
        best = name;
      }
    }
    return best;
  })();

  const scored: { r: Row; s: number }[] = [];
  const scoreOf = new Map<Row, number>();
  for (const r of rows) {
    if (gender && r.gender !== gender && r.gender !== "Unknown Gender") continue;
    if (geo && r.geo !== geo) continue;
    if (ages && !ages.includes(r.age)) continue;
    let s = 0;
    const sig = clean(r.signal);
    if (q.length > 4 && sig.includes(q)) s += 10;
    for (const w of qt) {
      if (sig.includes(w)) s += 5;
      if (clean(r.category).includes(w)) s += 4;
      if (clean(r.sub).includes(w)) s += 4;
    }
    if (qSector && r.sector === qSector) s += 6;
    else if (qSector && r.sector !== "Cross-Sector") s -= 4;
    if (isPremium && PREMIUM_WORDS.some((w) => r.text.includes(w))) s += 6;
    if (isMigration && /(cash|cod|debit|atm|card|pos|bank)/.test(r.text)) s += 5;
    if (isMigration && /(upi|wallet)/.test(r.text)) s -= 8;
    if (gender || geo || ages) s += 2;
    if (s >= 5) {
      scored.push({ r, s });
      scoreOf.set(r, s);
    }
  }


  const strong = scored.filter((x) => x.s >= 8);
  const used = strong.length >= 10 ? strong : scored;

  // group
  const groups = new Map<string, Group>();
  for (const { r } of used) {
    const k = normKey(r);
    let g = groups.get(k);
    if (!g) {
      g = { key: k, label: r.signal.replace(/\s*-\s*Last \d+ Days?/i, "").trim(), sector: r.sector, layer: r.layer, partners: [], volume: 0, rows: [] };
      groups.set(k, g);
    }
    g.rows.push(r);
    if (!g.partners.includes(r.partner)) g.partners.push(r.partner);
  }

  const cellFactor = (partnersCount: number) => (partnersCount > 2 ? 0.3 : 0.4);
  const premiumFactor = isPremium && !scored.some(({ r }) => PREMIUM_WORDS.some((w) => r.text.includes(w))) ? 0.35 : 1;

  /* ---- query-intent skews so splits react to what the planner typed ---- */
  const isMass = /(value|budget|mass|rural|bharat|entry level|affordable|small town)/.test(q);
  const isYoung = /(gen z|youth|young|college|student|teen|18|22|24|gaming|ott|streaming|social|app)/.test(q);
  const isFamily = /(family|parent|mother|father|household|kids|children|baby)/.test(q);
  const isMature = /(senior|retire|45|50|insurance|investment|mutual fund|suv|sedan|luxury car|home loan)/.test(q);
  const femaleTilt = /(beauty|skincare|skin care|cosmetic|makeup|salon|fragrance|personal care|jewell|saree|women|female)/.test(q);
  const maleTilt = /(bike|motorcycle|scooter|auto|car|suv|gaming|cricket|sports|men|male|trading|shaving|grooming)/.test(q);

  const geoW = (g: string) => {
    const t = clean(g);
    if (isPremium) return t.includes("metro") ? 1.7 : t.includes("1") ? 1.25 : t.includes("2") ? 0.65 : 0.4;
    if (isMass) return t.includes("metro") ? 0.55 : t.includes("1") ? 0.85 : t.includes("2") ? 1.3 : 1.6;
    if (qSector === "Travel & Hospitality" || qSector === "Digital & Apps") return t.includes("metro") ? 1.35 : t.includes("1") ? 1.1 : 0.8;
    if (qSector === "CPG / FMCG") return t.includes("metro") ? 1.15 : t.includes("2") ? 1.1 : 0.95;
    return 1;
  };

  const ageStart = (a: string) => {
    const m = clean(a).match(/(\d+)/);
    if (/less than/.test(clean(a))) return 20;
    return m ? Number(m[1]) : 33;
  };
  const ageW = (a: string) => {
    const st = ageStart(a);
    let w = 1;
    if (isYoung) w *= st <= 28 ? 1.8 : st <= 34 ? 1.1 : st <= 46 ? 0.55 : 0.3;
    if (isFamily) w *= st >= 29 && st <= 46 ? 1.6 : st < 29 ? 0.6 : 0.8;
    if (isMature) w *= st >= 41 ? 1.7 : st >= 35 ? 1.2 : 0.5;
    if (isPremium) w *= st >= 29 && st <= 52 ? 1.25 : 0.8;
    return w;
  };

  const genW = (gd: string) => {
    const t = clean(gd);
    if (femaleTilt && !maleTilt) return t.includes("female") ? 1.9 : t.includes("male") ? 0.55 : 1;
    if (maleTilt && !femaleTilt) return t.includes("female") ? 0.55 : t.includes("male") ? 1.7 : 1;
    return 1;
  };

  const splitGeo = new Map<string, number>();
  const splitAge = new Map<string, number>();
  const splitGen = new Map<string, number>();
  let total = 0;
  let wGeo = 0;
  let wAge = 0;
  let wGen = 0;

  for (const g of groups.values()) {
    const cells = new Map<string, Map<string, number>>();
    const cellScore = new Map<string, number[]>();
    for (const r of g.rows) {
      const ck = `${r.geo}|${r.age}|${r.gender}`;
      let m = cells.get(ck);
      if (!m) {
        m = new Map();
        cells.set(ck, m);
      }
      m.set(r.partner, Math.max(m.get(r.partner) || 0, r.volume));
      const cs = cellScore.get(ck) || [];
      cs.push(scoreOf.get(r) || 1);
      cellScore.set(ck, cs);
    }
    let gv = 0;
    for (const [ck, m] of cells) {
      const vals = Array.from(m.values()).sort((a, b) => b - a);
      const f = cellFactor(vals.length);
      let v = (vals[0] || 0) + vals.slice(1).reduce((a, b) => a + b * f, 0);
      v *= premiumFactor;
      gv += v;
      const [gt, ab, gd] = ck.split("|");
      const sc = cellScore.get(ck) || [1];
      const rel = sc.reduce((a, b) => a + b, 0) / sc.length / 10;
      const base = v * Math.max(0.2, rel);
      const vg = base * geoW(gt);
      const va = base * ageW(ab);
      const vd = base * genW(gd);
      splitGeo.set(gt, (splitGeo.get(gt) || 0) + vg);
      splitAge.set(ab, (splitAge.get(ab) || 0) + va);
      splitGen.set(gd, (splitGen.get(gd) || 0) + vd);
      wGeo += vg;
      wAge += va;
      wGen += vd;
    }
    g.volume = gv;
    total += gv;
  }

  const list = Array.from(groups.values()).sort((a, b) => b.volume - a.volume);
  const partners = new Set<string>();
  list.forEach((g) => g.partners.forEach((p) => partners.add(p)));
  const confidence = strong.length > 200 && partners.size >= 3 ? "High" : strong.length > 30 || partners.size >= 2 ? "Medium" : "Low";

  const toSplit = (m: Map<string, number>, w: number) =>
    Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => ({ label: k, value: w ? (v / w) * total : 0, pct: w ? (v / w) * 100 : 0 }));


  return {
    title: qRaw.trim().replace(/\b\w/g, (c) => c.toUpperCase()),
    total,
    confidence,
    groups: list.slice(0, 8),
    allGroups: list,
    partners: Array.from(partners),
    geo: toSplit(splitGeo),
    age: toSplit(splitAge),
    gender: toSplit(splitGen),
    isPremium,
    isMigration,
  };
}

/* ---------------- UI ---------------- */
const Bars = ({ title, data }: { title: string; data: { label: string; value: number; pct: number }[] }) => (
  <div>
    <div className="mb-3 text-sm font-semibold text-slate-700">{title}</div>
    <div className="space-y-2.5">
      {data.slice(0, 8).map((d) => (
        <div key={d.label}>
          <div className="mb-1 flex justify-between text-xs text-slate-600">
            <span className="font-medium">{d.label}</span>
            <span>
              {fmt(d.value)} · {d.pct.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400" style={{ width: `${Math.max(2, d.pct)}%` }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const EXAMPLES = ["premium skincare buyers", "SUV intenders", "UPI migration audience", "quick commerce snack buyers", "affluent travellers", "college students", "high-value shoppers"];

const LAYER_CARDS = [
  { t: "Demographics", d: "Age, gender and household cuts", g: "from-indigo-500 to-blue-500" },
  { t: "Affluence", d: "Premium and high-value indicators", g: "from-violet-500 to-fuchsia-500" },
  { t: "Commerce", d: "Purchase and basket behaviour", g: "from-cyan-500 to-teal-500" },
  { t: "Lifestyle", d: "Interests and affinity signals", g: "from-emerald-500 to-lime-500" },
  { t: "Digital & App", d: "App, payments and online activity", g: "from-sky-500 to-indigo-500" },
  { t: "Intent", d: "In-market and enquiry signals", g: "from-amber-500 to-orange-500" },
];

export default function CohortPlanner() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ReturnType<typeof runQuery> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    if (!rows) return null;
    const p = new Set<string>();
    const s = new Set<string>();
    const t = new Set<string>();
    let vol = 0;
    for (const r of rows) {
      p.add(r.partner);
      s.add(r.signal);
      t.add(r.geo);
      vol += r.volume;
    }
    return { rows: rows.length, partners: p.size, signals: s.size, tiers: t.size, vol };
  }, [rows]);

  const onFile = async (f: File) => {
    setLoading(true);
    setResult(null);
    try {
      let text = "";
      if (/\.(xlsx|xls)$/i.test(f.name)) {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(await f.arrayBuffer(), { type: "array" });
        text = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
      } else {
        text = await f.text();
      }
      setRows(parseCSV(text));
    } finally {
      setLoading(false);
    }
  };

  const search = (q: string) => {
    if (!rows || !q.trim()) return;
    setQuery(q);
    setResult(runQuery(rows, q));
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white p-5 lg:flex">
        <div className="mb-8">
          <div className="text-lg font-bold tracking-tight">GDE Platform</div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400">Audience Intelligence</div>
        </div>
        <nav className="space-y-1 text-sm">
          {["Planning", "Segmentation", "Enrichment", "Activation"].map((n, i) => (
            <div key={n} className={`rounded-lg px-3 py-2 ${i === 0 ? "bg-gradient-to-r from-indigo-600 to-violet-600 font-semibold text-white shadow" : "text-slate-500 hover:bg-slate-100"}`}>
              {n}
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-6 py-10">
          {/* hero */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-400/30 to-cyan-300/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-gradient-to-br from-violet-400/20 to-fuchsia-300/20 blur-3xl" />
            <div className="relative">
              <div className="mb-3 inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">WPP Audience Intelligence Planning Platform</div>
              <h1 className="max-w-3xl bg-gradient-to-r from-slate-900 via-indigo-800 to-violet-700 bg-clip-text text-5xl font-extrabold leading-tight text-transparent">Ask The Cohort. Know The Scale.</h1>
              <p className="mt-4 max-w-2xl text-slate-600">
                Discover relevant cohorts across WPP’s partner data ecosystem, understand available audience scale, and identify usable audience signals across sectors.
              </p>
            </div>
          </div>

          {/* upload + search */}
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-lg font-semibold">What cohort are you looking for?</div>
              <div className="flex items-center gap-3">
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
                <button onClick={() => fileRef.current?.click()} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Upload Audience Dataset
                </button>
              </div>
            </div>

            {loading && <div className="mt-3 text-sm text-indigo-600">Loading dataset…</div>}
            {stats && !loading && (
              <div className="mt-3 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
                Dataset loaded successfully · {stats.rows.toLocaleString()} rows · {stats.partners} partner sources · {stats.signals.toLocaleString()} audience signals
              </div>
            )}
            {!rows && !loading && <div className="mt-3 text-sm text-slate-500">Upload the audience dataset to start planning.</div>}

            <div className="mt-5 flex gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search(query)}
                placeholder="Search for audiences like premium skincare buyers, SUV intenders, UPI migration audience…"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-indigo-400 focus:bg-white"
              />
              <button onClick={() => search(query)} className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:opacity-95">
                Find Scale
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {EXAMPLES.map((e) => (
                <button key={e} onClick={() => search(e)} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700">
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* metrics */}
          {stats && (
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { l: "Addressable Planning Universe", v: fmt(stats.vol) },
                { l: "Audience Signals", v: stats.signals.toLocaleString() },
                { l: "Partner Sources", v: String(stats.partners) },
                { l: "Geo Tiers Available", v: String(stats.tiers) },
              ].map((m) => (
                <div key={m.l} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-3xl font-bold text-slate-900">{m.v}</div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{m.l}</div>
                </div>
              ))}
            </div>
          )}

          {/* layers */}
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-6">
            {LAYER_CARDS.map((c) => (
              <div key={c.t} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className={`mb-3 h-9 w-9 rounded-xl bg-gradient-to-br ${c.g}`} />
                <div className="text-sm font-semibold">{c.t}</div>
                <div className="mt-1 text-xs text-slate-500">{c.d}</div>
              </div>
            ))}
          </div>

          {/* results */}
          {result && (
            <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[62fr_38fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">Available audience scale</div>
                    <div className="mt-1 text-2xl font-bold">{result.title}</div>
                    <div className="mt-3 bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-6xl font-extrabold text-transparent">{fmt(result.total)}</div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      result.confidence === "High" ? "bg-emerald-50 text-emerald-700" : result.confidence === "Medium" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Planning confidence: {result.confidence}
                  </span>
                </div>

                <div className="mt-7 text-sm font-semibold text-slate-700">Matched Audience Signals</div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-slate-400">
                        <th className="pb-2">Audience Signal</th>
                        <th className="pb-2">Sector</th>
                        <th className="pb-2">Layer</th>
                        <th className="pb-2">Partner Sources</th>
                        <th className="pb-2 text-right">Scale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.groups.map((g) => (
                        <tr key={g.key} className="hover:bg-slate-50">
                          <td className="max-w-[260px] truncate py-3 font-medium text-slate-800">{g.label}</td>
                          <td className="py-3 text-slate-600">{g.sector}</td>
                          <td className="py-3 text-slate-600">{g.layer}</td>
                          <td className="py-3 text-slate-600">{g.partners.join(", ")}</td>
                          <td className="py-3 text-right font-semibold">{fmt(g.volume)}</td>
                        </tr>
                      ))}
                      {!result.groups.length && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-500">
                            No matching audience signals found. Try a broader cohort description.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* activation cards */}
                {result.allGroups.length > 0 && (
                  <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-3">
                    {[
                      { t: "Primary Audience", g: result.allGroups[0], d: "Strongest matched audience" },
                      { t: "Expansion Audience", g: result.allGroups[1] || result.allGroups[0], d: "Related high-scale audience" },
                      { t: "Precision Audience", g: result.allGroups[result.allGroups.length - 1], d: "Smaller, higher-confidence audience" },
                    ].map((c) => (
                      <div key={c.t} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{c.t}</div>
                        <div className="mt-1 truncate text-sm font-medium text-slate-800">{c.g.label}</div>
                        <div className="mt-2 text-2xl font-bold">{fmt(c.g.volume)}</div>
                        <div className="mt-1 text-xs text-slate-500">{c.d}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="text-lg font-semibold">Audience Split</div>
                <Bars title="Geo-tier split" data={result.geo} />
                <Bars title="Age-band split" data={result.age} />
                <Bars title="Gender split" data={result.gender} />
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-700">How this audience was built</div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    Matched relevant partner audience signals, grouped similar cohort meanings, and applied geo, age and gender planning cuts from the uploaded dataset.
                    {result.isPremium && " Premium and high-value audience signals were prioritized."}
                    {result.isMigration && " Built using alternate payment behaviour, digital readiness, and payment adoption signals."}
                  </p>
                  <div className="mt-3 text-xs text-slate-500">Partner sources: {result.partners.join(", ") || "—"}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
