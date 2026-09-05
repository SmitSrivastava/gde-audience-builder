import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Row,
  Expression,
  BlockNode,
  GroupNode,
  Block,
  fmt,
  parseCSV,
  getBundledRows,
  datasetStats,
  runSearch,
  runBuild,
  CORE_LIST,
  CORE_CATEGORIES,
  MODIFIERS,
  INTENTS,
  GEOS,
  AGES,
  GENDERS,
  PlanResult,
} from "@/lib/planningEngine";

import { supabase } from "@/integrations/supabase/client";

const LS_KEY = "gde_planning_dataset_v1";

/* Convert the plan-audience payload (SQL + rules driven) into the UI shape. */
function toPlanResult(brief: string, d: any): PlanResult {
  const groups = (d.matched_signals || []).map((m: any, i: number) => ({
    key: m.master_signal_id || `m${i}`,
    label: m.audience_signal,
    sector: m.sector || "—",
    layer: m.layer || "—",
    partners: [m.partner_sources].filter(Boolean),
    volume: Number(m.scale) || 0,
  }));
  const bars = (arr: any[], key: string) =>
    (arr || []).map((x) => ({ label: x[key], value: Number(x.volume) || 0, pct: (Number(x.share) || 0) * 100 }));
  const hb = d.how_built || {};
  return {
    title: brief,
    total: Number(d.people_reach) || 0,
    confidence: (d.planning_confidence as PlanResult["confidence"]) || "Medium",
    groups,
    allGroups: groups,
    geo: bars(d.geo_split, "geo_tier"),
    age: bars(d.age_split, "age_bucket"),
    gender: bars(d.gender_split, "gender_bucket"),
    partners: d.partners || [],
    notes: `Join ${hb.join || "OR"} across ${(hb.anchors || []).join(", ") || "matched families"}${
      (hb.modifiers || []).length ? ` with modifiers ${(hb.modifiers || []).map((m: any) => m.token).join(", ")}` : ""
    }. People reach is de-duplicated across partners using stored overlap rules, capped by India population ceilings. Rules applied: ${(hb.rules || []).join(" · ")}.`,
  } as PlanResult;
}


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
  { t: "Lifestyle", d: "Interests and affinity signals", g: "from-sky-500 to-indigo-500" },
  { t: "Digital & App", d: "App, payments and online activity", g: "from-blue-500 to-violet-500" },
  { t: "Intent", d: "In-market and enquiry signals", g: "from-amber-500 to-orange-500" },
];

let uid = 0;
const nid = () => `n${++uid}`;
const newBlock = (): BlockNode => ({ id: nid(), type: "BLOCK", block: { id: nid(), core_category: CORE_LIST[0], modifiers: [], filters: {} } });
const newGroup = (): GroupNode => ({ id: nid(), type: "GROUP", operator: "AND", children: [newBlock(), newBlock()], group_modifiers: [], filters: {} });

/* ---------------- Build Audience editor ---------------- */
const FilterRow = ({ filters, onChange }: { filters: Block["filters"]; onChange: (f: Block["filters"]) => void }) => (
  <div className="flex flex-wrap gap-2">
    {[
      { k: "geo_tier" as const, list: GEOS, ph: "Any geo tier" },
      { k: "age_bucket" as const, list: AGES, ph: "Any age band" },
      { k: "gender" as const, list: GENDERS, ph: "Any gender" },
    ].map((f) => (
      <select
        key={f.k}
        value={(filters as any)[f.k] || ""}
        onChange={(e) => onChange({ ...filters, [f.k]: e.target.value || undefined })}
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
      >
        <option value="">{f.ph}</option>
        {f.list.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    ))}
  </div>
);

const ModifierChips = ({ selected, onToggle }: { selected: string[]; onToggle: (m: string) => void }) => (
  <div className="flex flex-wrap gap-1.5">
    {MODIFIERS.map((m) => (
      <button
        key={m}
        onClick={() => onToggle(m)}
        className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
          selected.includes(m) ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow" : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
        }`}
      >
        {m}
      </button>
    ))}
  </div>
);

function ExpressionEditor({ node, onChange, onRemove, depth = 0 }: { node: Expression; onChange: (n: Expression) => void; onRemove?: () => void; depth?: number }) {
  if (node.type === "BLOCK") {
    const b = node.block;
    const set = (patch: Partial<Block>) => onChange({ ...node, block: { ...b, ...patch } });
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-1 flex-wrap gap-2">
            <select value={b.core_category} onChange={(e) => set({ core_category: e.target.value })} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800">
              {CORE_LIST.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select value={b.intent || ""} onChange={(e) => set({ intent: e.target.value || undefined })} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700">
              <option value="">Any intent</option>
              {INTENTS.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">{CORE_CATEGORIES[b.core_category]?.sector}</span>
          </div>
          {onRemove && (
            <button onClick={onRemove} className="text-xs font-medium text-slate-400 hover:text-rose-500">
              Remove
            </button>
          )}
        </div>
        <div className="mt-3 space-y-2">
          <ModifierChips selected={b.modifiers} onToggle={(m) => set({ modifiers: b.modifiers.includes(m) ? b.modifiers.filter((x) => x !== m) : [...b.modifiers, m] })} />
          <FilterRow filters={b.filters} onChange={(f) => set({ filters: f })} />
        </div>
      </div>
    );
  }

  const g = node;
  const set = (patch: Partial<GroupNode>) => onChange({ ...g, ...patch });
  return (
    <div className={`rounded-2xl border-2 border-dashed p-4 ${depth % 2 ? "border-cyan-200 bg-cyan-50/40" : "border-violet-200 bg-violet-50/40"}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white">
          {(["AND", "OR", "EXCLUDE"] as const).map((op) => (
            <button key={op} onClick={() => set({ operator: op })} className={`px-3 py-1.5 text-xs font-semibold ${g.operator === op ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>
              {op}
            </button>
          ))}
        </div>
        <ModifierChips selected={g.group_modifiers} onToggle={(m) => set({ group_modifiers: g.group_modifiers.includes(m) ? g.group_modifiers.filter((x) => x !== m) : [...g.group_modifiers, m] })} />
        <FilterRow filters={g.filters} onChange={(f) => set({ filters: f })} />
        {onRemove && (
          <button onClick={onRemove} className="ml-auto text-xs font-medium text-slate-400 hover:text-rose-500">
            Remove group
          </button>
        )}
      </div>
      <div className="space-y-3">
        {g.children.map((c, i) => (
          <ExpressionEditor
            key={c.id}
            node={c}
            depth={depth + 1}
            onChange={(n) => set({ children: g.children.map((x, j) => (j === i ? n : x)) })}
            onRemove={g.children.length > 1 ? () => set({ children: g.children.filter((_, j) => j !== i) }) : undefined}
          />
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={() => set({ children: [...g.children, newBlock()] })} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-indigo-300">
          + Add audience block
        </button>
        <button onClick={() => set({ children: [...g.children, newGroup()] })} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-indigo-300">
          + Add nested group
        </button>
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */
export default function CohortPlanner() {
  const [rows, setRows] = useState<Row[]>(() => getBundledRows());
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"search" | "build">("search");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<PlanResult | null>(null);
  const [expr, setExpr] = useState<Expression>(() => newGroup());
  const [planning, setPlanning] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [chips, setChips] = useState<string[]>(EXAMPLES);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("seed_chip").select("chip_label").then(({ data }) => {
      const labels = (data || []).map((c: any) => c.chip_label).filter(Boolean);
      if (labels.length) setChips(labels);
    });
  }, []);


  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Row[];
        if (Array.isArray(parsed) && parsed.length) setRows(parsed);
      }
    } catch {
      /* keep bundled dataset */
    }
  }, []);

  const [liveStats, setLiveStats] = useState<{ signals: number; partners: number } | null>(null);
  useEffect(() => {
    (async () => {
      const [{ count }, { data: p }] = await Promise.all([
        supabase.from("signal").select("master_signal_id", { count: "exact", head: true }),
        supabase.from("partner").select("partner_name"),
      ]);
      if (count) setLiveStats({ signals: count, partners: (p || []).length });
    })();
  }, []);

  const stats = useMemo(() => datasetStats(rows), [rows]);


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
      const parsed = parseCSV(text);
      if (parsed.length) {
        setRows(parsed);
        try {
          localStorage.setItem(LS_KEY, JSON.stringify(parsed));
        } catch {
          /* stays available for this session */
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const search = async (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setPlanning(true);
    setPlanError(null);
    try {
      const { data, error } = await supabase.functions.invoke("plan-audience", { body: { brief: q } });
      if (error) throw error;
      if (data?.refuse?.flag) {
        setResult(null);
        setPlanError(data.refuse.reason || "No known audience family found in this brief.");
        return;
      }
      setResult(toPlanResult(q, data));
    } catch (e) {
      console.error("plan-audience failed", e);
      setResult(runSearch(rows, q));
      setPlanError("Live planning engine unavailable — showing local estimate.");
    } finally {
      setPlanning(false);
    }
  };


  const build = () => {
    const labels: string[] = [];
    const walk = (n: Expression) => (n.type === "BLOCK" ? labels.push(n.block.core_category) : n.children.forEach(walk));
    walk(expr);
    setResult(runBuild(rows, expr, Array.from(new Set(labels)).join(" + ") || "Custom Audience"));
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
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

          {/* panel */}
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex overflow-hidden rounded-xl border border-slate-200">
                {(["search", "build"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 text-sm font-semibold ${tab === t ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
                    {t === "search" ? "Search Audience" : "Build Audience"}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
                <button onClick={() => fileRef.current?.click()} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Upload Audience Dataset
                </button>
              </div>
            </div>

            {loading ? (
              <div className="mt-3 text-sm text-indigo-600">Loading dataset…</div>
            ) : (
              <div className="mt-3 rounded-xl bg-indigo-50 px-4 py-2 text-sm text-indigo-800">
                Dataset loaded successfully · {stats.rows.toLocaleString()} rows · {stats.partners} partner sources · {stats.signals.toLocaleString()} audience signals
              </div>
            )}

            {tab === "search" ? (
              <>
                <div className="mt-5 text-lg font-semibold">What cohort are you looking for?</div>
                <div className="mt-3 flex gap-3">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && search(query)}
                    placeholder="Search for audiences like premium skincare buyers, SUV intenders, UPI migration audience…"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-indigo-400 focus:bg-white"
                  />
                  <button
                    onClick={() => search(query)}
                    disabled={planning}
                    className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:opacity-95 disabled:opacity-60"
                  >
                    {planning ? "Planning…" : "Find Scale"}
                  </button>
                </div>
                {planError && <div className="mt-3 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">{planError}</div>}
                <div className="mt-4 flex flex-wrap gap-2">
                  {chips.map((e) => (
                    <button key={e} onClick={() => search(e)} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700">
                      {e}
                    </button>
                  ))}
                </div>

              </>
            ) : (
              <>
                <div className="mt-5 text-lg font-semibold">Compose your audience</div>
                <p className="mt-1 text-xs text-slate-500">Combine audience blocks with AND, OR and EXCLUDE. Modifiers and filters apply to the block or group they sit on.</p>
                <div className="mt-4">
                  <ExpressionEditor node={expr} onChange={setExpr} />
                </div>
                <button onClick={build} className="mt-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:opacity-95">
                  Calculate Audience Scale
                </button>
              </>
            )}
          </div>

          {/* metrics */}
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
                      result.confidence === "High" ? "bg-indigo-50 text-indigo-700" : result.confidence === "Medium" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
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
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{result.notes}</p>
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
