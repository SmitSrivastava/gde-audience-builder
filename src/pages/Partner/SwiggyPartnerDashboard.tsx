import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ArrowLeft,
  Database,
  Layers,
  Fingerprint,
  UploadCloud,
  Users2,
  Percent,
  Megaphone,
  BarChart3,
  ShieldAlert,
  Download,
} from 'lucide-react';

/* ----------------------------- Dummy data ----------------------------- */

const datasets = [
  { name: 'Instamart Grocery Behaviour', category: 'Q-Commerce', source: '31.2M', ids: '22.8M', refresh: '08 Aug 2026', expiry: '08 Nov 2026', status: 'Active', platforms: 'Google Ads, DV360, Meta', useCases: 'Targeting, Suppression, Lookalike Seed' },
  { name: 'Swiggy Food Ordering Signals', category: 'Food Commerce', source: '26.4M', ids: '18.1M', refresh: '09 Aug 2026', expiry: '09 Nov 2026', status: 'Active', platforms: 'Google Ads, DV360', useCases: 'Targeting, Retargeting' },
  { name: 'Instamart High-Value Buyers', category: 'Commerce Value', source: '15.9M', ids: '11.5M', refresh: '06 Aug 2026', expiry: '06 Nov 2026', status: 'Active', platforms: 'DV360, Meta', useCases: 'Targeting, Lookalike Seed' },
];

type Cohort = {
  name: string;
  category: string;
  dataset: string;
  ids: string;
  idsNum: number;
  platforms: string[];
  matched: string;
  matchedNum: number;
  rate: number;
  status: string;
  refresh: string;
  expiry: string;
  used: boolean;
  campaigns: number;
  impressions: string;
  usageType: string;
  breakdown: { platform: string; pushed: string; matched: string; rate: string; upload: string }[];
};

const cohorts: Cohort[] = [
  {
    name: 'High-Intent Grocery Buyers', category: 'Q-Commerce', dataset: 'Instamart Grocery Behaviour',
    ids: '8.5M', idsNum: 8.5, platforms: ['Google Ads', 'DV360', 'Meta'], matched: '5.6M', matchedNum: 5.6, rate: 66,
    status: 'Active', refresh: '08 Aug 2026', expiry: '08 Nov 2026', used: true, campaigns: 3, impressions: '24.8M', usageType: 'Targeting',
    breakdown: [
      { platform: 'Google Ads', pushed: '8.5M', matched: '2.1M', rate: '25%', upload: 'Active' },
      { platform: 'DV360', pushed: '8.5M', matched: '2.3M', rate: '27%', upload: 'Active' },
      { platform: 'Meta', pushed: '8.5M', matched: '1.2M', rate: '14%', upload: 'Active' },
    ],
  },
  {
    name: 'Premium Basket Shoppers', category: 'Commerce Value', dataset: 'Instamart High-Value Buyers',
    ids: '6.2M', idsNum: 6.2, platforms: ['DV360', 'Meta'], matched: '3.9M', matchedNum: 3.9, rate: 63,
    status: 'Active', refresh: '06 Aug 2026', expiry: '06 Nov 2026', used: true, campaigns: 2, impressions: '11.4M', usageType: 'Lookalike Seed',
    breakdown: [
      { platform: 'DV360', pushed: '6.2M', matched: '2.4M', rate: '39%', upload: 'Active' },
      { platform: 'Meta', pushed: '6.2M', matched: '1.5M', rate: '24%', upload: 'Active' },
    ],
  },
  {
    name: 'Frequent Instamart Users', category: 'Frequency', dataset: 'Instamart Grocery Behaviour',
    ids: '11.8M', idsNum: 11.8, platforms: ['Google Ads', 'DV360'], matched: '7.4M', matchedNum: 7.4, rate: 63,
    status: 'Active', refresh: '08 Aug 2026', expiry: '08 Nov 2026', used: true, campaigns: 4, impressions: '18.9M', usageType: 'Targeting',
    breakdown: [
      { platform: 'Google Ads', pushed: '11.8M', matched: '3.9M', rate: '33%', upload: 'Active' },
      { platform: 'DV360', pushed: '11.8M', matched: '3.5M', rate: '30%', upload: 'Active' },
    ],
  },
  {
    name: 'Snacks & Beverage Buyers', category: 'Category Buyers', dataset: 'Swiggy Food Ordering Signals',
    ids: '7.1M', idsNum: 7.1, platforms: ['Google Ads', 'Meta'], matched: '4.0M', matchedNum: 4.0, rate: 56,
    status: 'Active', refresh: '09 Aug 2026', expiry: '09 Nov 2026', used: true, campaigns: 1, impressions: '9.6M', usageType: 'Suppression',
    breakdown: [
      { platform: 'Google Ads', pushed: '7.1M', matched: '2.2M', rate: '31%', upload: 'Active' },
      { platform: 'Meta', pushed: '7.1M', matched: '1.8M', rate: '25%', upload: 'Active' },
    ],
  },
  {
    name: 'Monthly High Spenders', category: 'High Value', dataset: 'Instamart High-Value Buyers',
    ids: '4.8M', idsNum: 4.8, platforms: ['DV360'], matched: '2.7M', matchedNum: 2.7, rate: 56,
    status: 'Matched', refresh: '06 Aug 2026', expiry: '06 Nov 2026', used: false, campaigns: 0, impressions: '0', usageType: '—',
    breakdown: [{ platform: 'DV360', pushed: '4.8M', matched: '2.7M', rate: '56%', upload: 'Active' }],
  },
  {
    name: 'Lapsed Grocery Buyers', category: 'Reactivation', dataset: 'Instamart Grocery Behaviour',
    ids: '5.5M', idsNum: 5.5, platforms: ['Google Ads', 'Meta'], matched: '3.2M', matchedNum: 3.2, rate: 58,
    status: 'Active', refresh: '02 Aug 2026', expiry: '02 Nov 2026', used: true, campaigns: 2, impressions: '7.2M', usageType: 'Retargeting',
    breakdown: [
      { platform: 'Google Ads', pushed: '5.5M', matched: '1.7M', rate: '31%', upload: 'Active' },
      { platform: 'Meta', pushed: '5.5M', matched: '1.5M', rate: '27%', upload: 'Pending Refresh' },
    ],
  },
];

const platformRows = [
  { platform: 'Google Ads', available: 8, used: 5, campaigns: 4, impressions: 38.4, status: 'Active' },
  { platform: 'DV360', available: 10, used: 7, campaigns: 8, impressions: 72.1, status: 'Active' },
  { platform: 'Meta', available: 8, used: 4, campaigns: 5, impressions: 32.1, status: 'Active' },
];

const campaigns = [
  { cohort: 'High-Intent Grocery Buyers', platform: 'DV360', account: 'Approved Advertiser A', usage: 'Targeting', status: 'Live', impressions: '24.8M', line: 'LI-4821 · Q-Comm Always On', flight: '01 Jul 2026 – 30 Sep 2026', refresh: '13 Aug 2026', scope: 'Within approved contract scope' },
  { cohort: 'Premium Basket Shoppers', platform: 'Meta', account: 'Approved Advertiser B', usage: 'Lookalike Seed', status: 'Completed', impressions: '11.4M', line: 'AS-2290 · Premium Basket LAL', flight: '05 Jun 2026 – 31 Jul 2026', refresh: '01 Aug 2026', scope: 'Within approved contract scope' },
  { cohort: 'Frequent Instamart Users', platform: 'Google Ads', account: 'Approved Advertiser C', usage: 'Targeting', status: 'Live', impressions: '18.9M', line: 'CMP-7714 · Frequency Push', flight: '15 Jul 2026 – 15 Sep 2026', refresh: '13 Aug 2026', scope: 'Within approved contract scope' },
  { cohort: 'Snacks & Beverage Buyers', platform: 'DV360', account: 'Approved Advertiser A', usage: 'Suppression', status: 'Live', impressions: '9.6M', line: 'LI-4990 · Snacks Suppression', flight: '20 Jul 2026 – 30 Sep 2026', refresh: '12 Aug 2026', scope: 'Within approved contract scope' },
  { cohort: 'Lapsed Grocery Buyers', platform: 'Meta', account: 'Approved Advertiser D', usage: 'Retargeting', status: 'Completed', impressions: '7.2M', line: 'AS-3120 · Winback', flight: '01 Jun 2026 – 25 Jul 2026', refresh: '26 Jul 2026', scope: 'Pending scope re-confirmation' },
];

const alerts = [
  {
    alert: 'Audience marked as shared', platform: 'Google Ads', cohort: 'Frequent Instamart Users', severity: 'Medium', status: 'Under Review',
    account: 'Approved Advertiser C', detected: '11 Aug 2026', owner: 'Governance Ops – WPP',
    why: 'The audience list is flagged as shared across linked accounts in the platform account structure.',
    action: 'Confirm the linked accounts are within the approved account permission map.',
    notes: 'Sharing status is treated as a review flag, not automatic misuse. Usage is monitored across approved platform accounts where WPP has API/reporting access. If the audience appears outside approved accounts or approved use cases, it will be escalated for review.',
  },
  {
    alert: 'Refresh overdue', platform: 'Meta', cohort: 'Lapsed Grocery Buyers', severity: 'Low', status: 'Pending Refresh',
    account: 'Approved Advertiser D', detected: '09 Aug 2026', owner: 'Partner Data Ops – Swiggy',
    why: 'Cohort refresh cadence of 30 days has been exceeded by 12 days.',
    action: 'Trigger a fresh hashed ID delivery and re-push to Meta.',
    notes: 'No usage restriction applied. Match rates may degrade until refreshed.',
  },
];

const platforms = ['All', 'Google Ads', 'DV360', 'Meta'] as const;

/* ----------------------------- UI atoms ----------------------------- */

const Chip = ({ tone, children }: { tone: 'ok' | 'warn' | 'info' | 'muted'; children: React.ReactNode }) => {
  const map = {
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warn: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-orange-50 text-orange-700 border-orange-200',
    muted: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${map[tone]}`}>{children}</span>;
};

const statusTone = (s: string): 'ok' | 'warn' | 'info' | 'muted' =>
  ['Active', 'Live', 'Clear'].includes(s) ? 'ok' : ['Under Review', 'Pending Refresh', 'Expired'].includes(s) ? 'warn' : s === 'Matched' ? 'info' : 'muted';

const Card = ({ title, children, className = '', highlight = false, innerRef }: any) => (
  <div
    ref={innerRef}
    className={`bg-white rounded-2xl border ${highlight ? 'border-orange-300 ring-2 ring-orange-200' : 'border-slate-200'} shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] transition-all ${className}`}
  >
    {title && <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">{title}</div>}
    {children}
  </div>
);

const Drawer = ({ open, title, onClose, children }: any) => (
  <>
    <div
      onClick={onClose}
      className={`fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    />
    <aside
      className={`fixed top-0 right-0 h-full w-full sm:w-[520px] bg-white z-50 shadow-2xl border-l border-slate-200 transition-transform duration-300 flex flex-col ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">{children}</div>
    </aside>
  </>
);

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
    <span className="text-xs font-medium text-slate-500">{label}</span>
    <span className="text-xs font-semibold text-slate-900 text-right">{value}</span>
  </div>
);

const SectionTitle = ({ children, note }: any) => (
  <div>
    <h4 className="text-sm font-bold text-slate-900">{children}</h4>
    {note && <p className="text-[11px] text-slate-500 mt-0.5">{note}</p>}
  </div>
);

/* ----------------------------- Page ----------------------------- */

const SwiggyPartnerDashboard = () => {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<string>('All');
  const [cohortFilter, setCohortFilter] = useState<string>('All');
  const [usageStatus, setUsageStatus] = useState<string>('All');
  const [govStatus, setGovStatus] = useState<string>('All');
  const [dateRange, setDateRange] = useState('Last 30 days');
  const [sortByImpressions, setSortByImpressions] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);

  const [drawer, setDrawer] = useState<{ type: string; payload?: any } | null>(null);

  const campaignRef = useRef<HTMLDivElement>(null);
  const platformRef = useRef<HTMLDivElement>(null);
  const govRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>, key: string) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlight(key);
    setTimeout(() => setHighlight((h) => (h === key ? null : h)), 2500);
  };

  /* ---------- filtering ---------- */
  const filteredCohorts = useMemo(
    () =>
      cohorts.filter((c) => {
        if (platform !== 'All' && !c.platforms.includes(platform)) return false;
        if (cohortFilter !== 'All' && c.name !== cohortFilter) return false;
        if (usageStatus === 'Used' && !c.used) return false;
        if (usageStatus === 'Not Used' && c.used) return false;
        if (usageStatus === 'Matched' && c.status !== 'Matched') return false;
        if (usageStatus === 'Pushed' && c.platforms.length === 0) return false;
        if (govStatus !== 'All') {
          const a = alerts.find((al) => al.cohort === c.name);
          const s = a ? a.status : 'Clear';
          if (s !== govStatus) return false;
        }
        return true;
      }),
    [platform, cohortFilter, usageStatus, govStatus]
  );

  const filteredCampaigns = useMemo(
    () =>
      campaigns.filter((c) => {
        if (platform !== 'All' && c.platform !== platform) return false;
        if (cohortFilter !== 'All' && c.cohort !== cohortFilter) return false;
        if (usageStatus === 'Not Used') return false;
        return filteredCohorts.some((fc) => fc.name === c.cohort);
      }),
    [platform, cohortFilter, usageStatus, filteredCohorts]
  );

  const filteredPlatforms = useMemo(() => {
    const rows = platformRows.filter((p) => platform === 'All' || p.platform === platform);
    return sortByImpressions ? [...rows].sort((a, b) => b.impressions - a.impressions) : rows;
  }, [platform, sortByImpressions]);

  const filteredAlerts = useMemo(
    () =>
      alerts.filter((a) => {
        if (platform !== 'All' && a.platform !== platform) return false;
        if (cohortFilter !== 'All' && a.cohort !== cohortFilter) return false;
        if (govStatus !== 'All' && a.status !== govStatus) return false;
        return true;
      }),
    [platform, cohortFilter, govStatus]
  );

  /* ---------- KPIs ---------- */
  const totalIds = filteredCohorts.reduce((s, c) => s + c.idsNum, 0);
  const totalMatched = filteredCohorts.reduce((s, c) => s + c.matchedNum, 0);
  const avgRate = filteredCohorts.length ? Math.round(filteredCohorts.reduce((s, c) => s + c.rate, 0) / filteredCohorts.length) : 0;
  const pushes = filteredCohorts.reduce((s, c) => s + (platform === 'All' ? c.platforms.length : 1), 0);
  const impressions = filteredPlatforms.reduce((s, p) => s + p.impressions, 0);

  const kpis = [
    { key: 'datasets', label: 'Datasets Onboarded', value: platform === 'All' ? '3' : '3', icon: Database },
    { key: 'cohorts', label: 'Cohorts Created', value: `${platform === 'All' && cohortFilter === 'All' && usageStatus === 'All' && govStatus === 'All' ? 12 : filteredCohorts.length}`, icon: Layers },
    { key: 'ids', label: 'Approved IDs', value: platform === 'All' ? '52.4M' : `${totalIds.toFixed(1)}M`, icon: Fingerprint },
    { key: 'pushes', label: 'Platform Pushes', value: platform === 'All' && cohortFilter === 'All' ? '26' : `${pushes}`, icon: UploadCloud },
    { key: 'matched', label: 'Matched Audience Size', value: platform === 'All' && cohortFilter === 'All' ? '31.8M' : `${totalMatched.toFixed(1)}M`, icon: Users2 },
    { key: 'rate', label: 'Avg. Match Rate', value: `${platform === 'All' && cohortFilter === 'All' ? 61 : avgRate}%`, icon: Percent },
    { key: 'campaigns', label: 'Campaigns Using Cohorts', value: platform === 'All' && cohortFilter === 'All' ? '9' : `${filteredCampaigns.length}`, icon: Megaphone },
    { key: 'impressions', label: 'Impressions Served', value: platform === 'All' ? '142.6M' : `${impressions.toFixed(1)}M`, icon: BarChart3 },
    { key: 'alerts', label: 'Open Governance Alerts', value: `${filteredAlerts.length}`, icon: ShieldAlert },
  ];

  const onKpiClick = (key: string) => {
    switch (key) {
      case 'campaigns':
        setUsageStatus('Used');
        scrollTo(campaignRef, 'campaigns');
        break;
      case 'impressions':
        setSortByImpressions(true);
        scrollTo(platformRef, 'platforms');
        break;
      case 'alerts':
        scrollTo(govRef, 'gov');
        break;
      case 'pushes':
        setUsageStatus('Pushed');
        setDrawer({ type: 'pushes' });
        break;
      case 'cohorts':
        setCohortFilter('All');
        setDrawer({ type: 'cohorts' });
        break;
      default:
        setDrawer({ type: key });
    }
  };

  const maxImp = Math.max(...platformRows.map((p) => p.impressions));

  const th = 'text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 px-4 py-3';
  const td = 'px-4 py-3 text-sm text-slate-700';
  const selectCls =
    'text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 hover:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-[1500px] mx-auto px-8 py-6">
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 mb-3">
            <ArrowLeft size={14} /> Back to Planning
          </button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center font-black">S</span>
                <h1 className="text-2xl font-bold tracking-tight">Swiggy/Instamart Data Partner Usage Dashboard</h1>
              </div>
              <p className="text-sm text-slate-500 mt-2 max-w-3xl">
                Track approved Swiggy/Instamart cohorts from onboarding to platform push, match scale, campaign usage and impressions served across approved platforms.
              </p>
            </div>
            <Chip tone="info">Partner Transparency View</Chip>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mt-5">
            <select className={selectCls} value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              {['Last 7 days', 'Last 30 days', 'Last 90 days', 'Quarter to date'].map((o) => <option key={o}>{o}</option>)}
            </select>
            <select className={selectCls} value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {platforms.map((p) => <option key={p} value={p}>{p === 'All' ? 'Platform: All' : p}</option>)}
            </select>
            <select className={selectCls} value={cohortFilter} onChange={(e) => setCohortFilter(e.target.value)}>
              <option value="All">Cohort: All</option>
              {cohorts.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
            <select className={selectCls} value={usageStatus} onChange={(e) => setUsageStatus(e.target.value)}>
              {['All', 'Pushed', 'Matched', 'Used', 'Not Used'].map((o) => <option key={o} value={o}>{o === 'All' ? 'Usage: All' : o}</option>)}
            </select>
            <select className={selectCls} value={govStatus} onChange={(e) => setGovStatus(e.target.value)}>
              {['All', 'Clear', 'Under Review', 'Pending Refresh', 'Expired'].map((o) => <option key={o} value={o}>{o === 'All' ? 'Governance: All' : o}</option>)}
            </select>

            {platform !== 'All' && (
              <button onClick={() => setPlatform('All')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500 text-white text-xs font-semibold">
                Platform: {platform} <X size={13} />
              </button>
            )}
            {(cohortFilter !== 'All' || usageStatus !== 'All' || govStatus !== 'All') && (
              <button
                onClick={() => { setCohortFilter('All'); setUsageStatus('All'); setGovStatus('All'); }}
                className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-8 py-8 space-y-6">
        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-9 gap-3">
          {kpis.map((k) => (
            <button
              key={k.key}
              onClick={() => onKpiClick(k.key)}
              className="text-left bg-white rounded-2xl border border-slate-200 p-4 hover:border-orange-300 hover:shadow-[0_12px_28px_-16px_rgba(249,115,22,0.5)] hover:-translate-y-0.5 transition-all"
            >
              <k.icon size={16} className="text-orange-500 mb-2" />
              <div className="text-xl font-extrabold tabular-nums text-slate-900">{k.value}</div>
              <div className="text-[11px] font-medium text-slate-500 leading-tight mt-1">{k.label}</div>
            </button>
          ))}
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card
            className="lg:col-span-3 overflow-hidden"
            title={
              <>
                <SectionTitle note="Click a cohort for full match, usage and governance detail">Cohort Onboarding &amp; Match</SectionTitle>
                <span className="text-xs text-slate-400">{filteredCohorts.length} cohorts</span>
              </>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/70">
                  <tr>{['Cohort', 'Category', 'Approved IDs', 'Platforms Pushed', 'Matched Size', 'Match Rate', 'Status'].map((h) => <th key={h} className={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filteredCohorts.map((c) => (
                    <tr key={c.name} onClick={() => setDrawer({ type: 'cohort', payload: c })} className="border-t border-slate-100 hover:bg-orange-50/50 cursor-pointer">
                      <td className={`${td} font-semibold text-slate-900`}>{c.name}</td>
                      <td className={td}>{c.category}</td>
                      <td className={`${td} tabular-nums`}>{c.ids}</td>
                      <td className={td}><div className="flex flex-wrap gap-1">{c.platforms.map((p) => <Chip key={p} tone="muted">{p}</Chip>)}</div></td>
                      <td className={`${td} tabular-nums font-semibold`}>{c.matched}</td>
                      <td className={td}>
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-orange-500" style={{ width: `${c.rate}%` }} /></div>
                          <span className="tabular-nums text-xs font-semibold">{c.rate}%</span>
                        </div>
                      </td>
                      <td className={td}><Chip tone={statusTone(c.status)}>{c.status}</Chip></td>
                    </tr>
                  ))}
                  {filteredCohorts.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No cohorts match the current filters.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>

          <Card
            innerRef={platformRef}
            highlight={highlight === 'platforms'}
            className="lg:col-span-2 overflow-hidden"
            title={
              <>
                <SectionTitle note="Click a platform to filter the whole dashboard">Platform Usage &amp; Delivery</SectionTitle>
                <button onClick={() => setSortByImpressions((s) => !s)} className="text-[11px] font-semibold text-orange-600 hover:underline">
                  {sortByImpressions ? 'Default order' : 'Sort by impressions'}
                </button>
              </>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/70"><tr>{['Platform', 'Avail.', 'Used', 'Campaigns', 'Impressions', 'Status'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {filteredPlatforms.map((p) => (
                    <tr key={p.platform} onClick={() => setPlatform(p.platform)} className="border-t border-slate-100 hover:bg-orange-50/50 cursor-pointer">
                      <td className={`${td} font-semibold text-slate-900`}>{p.platform}</td>
                      <td className={`${td} tabular-nums`}>{p.available}</td>
                      <td className={`${td} tabular-nums`}>{p.used}</td>
                      <td className={`${td} tabular-nums`}>{p.campaigns}</td>
                      <td className={`${td} tabular-nums font-semibold`}>{p.impressions}M</td>
                      <td className={td}><Chip tone="ok">{p.status}</Chip></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-5 border-t border-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-3">Impressions Served</p>
              <div className="space-y-3">
                {filteredPlatforms.map((p) => (
                  <button key={p.platform} onClick={() => setPlatform(p.platform)} className="w-full text-left group">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1">
                      <span>{p.platform}</span><span className="tabular-nums font-semibold text-slate-900">{p.impressions}M</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 group-hover:from-orange-600 transition-all" style={{ width: `${(p.impressions / maxImp) * 100}%` }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.85fr_1fr] gap-6">
          <div>
            <Card
              innerRef={campaignRef}
              highlight={highlight === 'campaigns'}
              className="overflow-hidden"
              title={
                <>
                  <SectionTitle note="Approved advertiser labels only. Spend, clicks and conversions are hidden by default.">Campaign Usage</SectionTitle>
                  <span className="text-xs text-slate-400">{filteredCampaigns.length} records</span>
                </>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/70"><tr>{['Cohort', 'Platform', 'Account / Advertiser', 'Usage Type', 'Campaign Status', 'Impressions'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredCampaigns.map((c, i) => (
                      <tr key={i} onClick={() => setDrawer({ type: 'usage', payload: c })} className="border-t border-slate-100 hover:bg-orange-50/50 cursor-pointer">
                        <td className={`${td} font-semibold text-slate-900`}>{c.cohort}</td>
                        <td className={td}>{c.platform}</td>
                        <td className={td}>{c.account}</td>
                        <td className={td}><Chip tone="info">{c.usage}</Chip></td>
                        <td className={td}><Chip tone={statusTone(c.status)}>{c.status}</Chip></td>
                        <td className={`${td} tabular-nums font-semibold`}>{c.impressions}</td>
                      </tr>
                    ))}
                    {filteredCampaigns.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">No campaign usage for the current filters.</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div>
            <Card
              innerRef={govRef}
              highlight={highlight === 'gov'}
              className="overflow-hidden h-full"
              title={<><SectionTitle note="Review flags, not automatic misuse">Governance Alerts</SectionTitle><Chip tone="warn">{filteredAlerts.length} open</Chip></>}
            >
              <div className="divide-y divide-slate-100">
                {filteredAlerts.map((a, i) => (
                  <button key={i} onClick={() => setDrawer({ type: 'gov', payload: a })} className="w-full text-left px-5 py-4 hover:bg-orange-50/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{a.alert}</p>
                        <p className="text-xs text-slate-500 mt-1">{a.platform} · {a.cohort}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <Chip tone={a.severity === 'Medium' ? 'warn' : 'muted'}>{a.severity}</Chip>
                        <Chip tone={statusTone(a.status)}>{a.status}</Chip>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredAlerts.length === 0 && <div className="px-5 py-10 text-center text-sm text-slate-400">No governance alerts for the current filters.</div>}
              </div>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 pb-10 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-600">Last refreshed: 13 Aug 2026, 10:30 AM IST</p>
          <p className="text-[11px] text-slate-500 mt-2 max-w-4xl leading-relaxed">
            Reporting is limited to approved platforms and accounts where WPP has API/reporting access. The dashboard does not expose raw user data or user-level records.
            Audience sharing or cross-account usage is treated as a review flag and governed as per agreed contract and approved use cases.
          </p>
        </div>
      </div>

      {/* ------------------------- Drawers ------------------------- */}
      <Drawer open={!!drawer} onClose={() => setDrawer(null)} title={drawerTitle(drawer)}>
        {drawer?.type === 'datasets' && datasets.map((d) => (
          <div key={d.name} className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-bold text-slate-900">{d.name}</p>
            <Field label="Category" value={d.category} />
            <Field label="Source records" value={d.source} />
            <Field label="Approved hashed IDs" value={d.ids} />
            <Field label="Refresh date" value={d.refresh} />
            <Field label="Expiry date" value={d.expiry} />
            <Field label="Status" value={<Chip tone="ok">{d.status}</Chip>} />
            <Field label="Allowed platforms" value={d.platforms} />
            <Field label="Allowed use cases" value={d.useCases} />
          </div>
        ))}

        {drawer?.type === 'cohorts' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">12 cohorts created from 3 approved datasets. 6 active cohorts shown in the main table.</p>
            {cohorts.map((c) => (
              <div key={c.name} className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-bold text-slate-900">{c.name}</p>
                <Field label="Category" value={c.category} />
                <Field label="Approved IDs" value={c.ids} />
                <Field label="Matched" value={`${c.matched} (${c.rate}%)`} />
                <Field label="Used in campaigns" value={c.used ? 'Yes' : 'No'} />
              </div>
            ))}
          </div>
        )}

        {drawer?.type === 'ids' && (
          <div className="space-y-3">
            {datasets.map((d) => (
              <div key={d.name} className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-bold text-slate-900">{d.name}</p>
                <Field label="Approved hashed IDs" value={d.ids} />
                <Field label="Push eligible platforms" value={d.platforms} />
                <Field label="Expiry" value={d.expiry} />
              </div>
            ))}
            <p className="text-[11px] text-slate-500">Total approved IDs: 52.4M hashed identifiers. No raw user-level records are exposed.</p>
          </div>
        )}

        {drawer?.type === 'pushes' && (
          <div className="space-y-3">
            {cohorts.map((c) => (
              <div key={c.name} className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-bold text-slate-900">{c.name}</p>
                {c.breakdown.map((b) => <Field key={b.platform} label={`${b.platform} · pushed`} value={`${b.pushed} · ${b.upload}`} />)}
              </div>
            ))}
          </div>
        )}

        {(drawer?.type === 'matched' || drawer?.type === 'rate') && (
          <div className="space-y-3">
            {cohorts.map((c) => (
              <div key={c.name} className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-bold text-slate-900">{c.name}</p>
                {c.breakdown.map((b) => (
                  <Field key={b.platform} label={b.platform} value={drawer.type === 'matched' ? b.matched : b.rate} />
                ))}
              </div>
            ))}
          </div>
        )}

        {drawer?.type === 'cohort' && drawer.payload && (
          <CohortDetail
            c={drawer.payload as Cohort}
            onCampaigns={() => { setDrawer(null); setCohortFilter(drawer.payload.name); scrollTo(campaignRef, 'campaigns'); }}
            onGovernance={() => { setDrawer(null); setCohortFilter(drawer.payload.name); scrollTo(govRef, 'gov'); }}
          />
        )}

        {drawer?.type === 'usage' && drawer.payload && (
          <div className="rounded-xl border border-slate-200 p-4">
            <Field label="Cohort" value={drawer.payload.cohort} />
            <Field label="Platform" value={drawer.payload.platform} />
            <Field label="Approved account" value={drawer.payload.account} />
            <Field label="Campaign / line item" value={drawer.payload.line} />
            <Field label="Usage type" value={drawer.payload.usage} />
            <Field label="Targeting / suppression" value={drawer.payload.usage === 'Suppression' ? 'Suppression' : 'Targeting'} />
            <Field label="Flight dates" value={drawer.payload.flight} />
            <Field label="Campaign status" value={<Chip tone={statusTone(drawer.payload.status)}>{drawer.payload.status}</Chip>} />
            <Field label="Impressions served" value={drawer.payload.impressions} />
            <Field label="Last delivery refresh" value={drawer.payload.refresh} />
            <Field label="Contract scope" value={drawer.payload.scope} />
            <p className="text-[11px] text-slate-500 mt-3">Spend, clicks, conversions and revenue are hidden by default. Impressions served is the primary delivery metric.</p>
          </div>
        )}

        {drawer?.type === 'gov' && drawer.payload && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <Field label="Alert type" value={drawer.payload.alert} />
              <Field label="Platform" value={drawer.payload.platform} />
              <Field label="Cohort" value={drawer.payload.cohort} />
              <Field label="Account / advertiser" value={drawer.payload.account} />
              <Field label="Severity" value={<Chip tone={drawer.payload.severity === 'Medium' ? 'warn' : 'muted'}>{drawer.payload.severity}</Chip>} />
              <Field label="Detection date" value={drawer.payload.detected} />
              <Field label="Owner" value={drawer.payload.owner} />
              <Field label="Current status" value={<Chip tone={statusTone(drawer.payload.status)}>{drawer.payload.status}</Chip>} />
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
              <p className="text-xs font-bold text-slate-900">Why it was flagged</p>
              <p className="text-xs text-slate-600">{drawer.payload.why}</p>
              <p className="text-xs font-bold text-slate-900 pt-2">Required action</p>
              <p className="text-xs text-slate-600">{drawer.payload.action}</p>
              <p className="text-xs font-bold text-slate-900 pt-2">Resolution notes</p>
              <p className="text-xs text-slate-600">{drawer.payload.notes}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-2 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600">Mark Reviewed</button>
              <button className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">Assign Owner</button>
              <button className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">Add Resolution Note</button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

const drawerTitle = (d: { type: string; payload?: any } | null) => {
  if (!d) return '';
  switch (d.type) {
    case 'datasets': return 'Dataset Details';
    case 'cohorts': return 'Cohort Summary';
    case 'ids': return 'Approved ID Breakdown';
    case 'pushes': return 'Platform Push History';
    case 'matched': return 'Matched Size by Platform';
    case 'rate': return 'Match Rate by Platform';
    case 'cohort': return `Cohort Detail: ${d.payload?.name}`;
    case 'usage': return 'Usage Detail';
    case 'gov': return 'Governance Review';
    default: return 'Details';
  }
};

const CohortDetail = ({ c, onCampaigns, onGovernance }: { c: Cohort; onCampaigns: () => void; onGovernance: () => void }) => (
  <div className="space-y-5">
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Cohort Summary</p>
      <Field label="Cohort" value={c.name} />
      <Field label="Category" value={c.category} />
      <Field label="Dataset source" value={c.dataset} />
      <Field label="Approved IDs" value={c.ids} />
      <Field label="Platforms pushed" value={c.platforms.join(', ')} />
      <Field label="Matched size" value={c.matched} />
      <Field label="Match rate" value={`${c.rate}%`} />
      <Field label="Status" value={<Chip tone={statusTone(c.status)}>{c.status}</Chip>} />
      <Field label="Refresh date" value={c.refresh} />
      <Field label="Expiry date" value={c.expiry} />
    </div>

    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 px-4 pt-4 pb-2">Platform Match Breakdown</p>
      <table className="w-full">
        <thead className="bg-slate-50"><tr>{['Platform', 'Pushed', 'Matched', 'Rate', 'Upload'].map((h) => <th key={h} className="text-left text-[10px] uppercase font-semibold text-slate-500 px-4 py-2">{h}</th>)}</tr></thead>
        <tbody>
          {c.breakdown.map((b) => (
            <tr key={b.platform} className="border-t border-slate-100">
              <td className="px-4 py-2.5 text-xs font-semibold text-slate-900">{b.platform}</td>
              <td className="px-4 py-2.5 text-xs text-slate-600 tabular-nums">{b.pushed}</td>
              <td className="px-4 py-2.5 text-xs text-slate-600 tabular-nums">{b.matched}</td>
              <td className="px-4 py-2.5 text-xs text-slate-600 tabular-nums">{b.rate}</td>
              <td className="px-4 py-2.5 text-xs"><Chip tone={statusTone(b.upload)}>{b.upload}</Chip></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Usage Summary</p>
      <Field label="Used in campaigns" value={c.used ? 'Yes' : 'No'} />
      <Field label="Campaigns / ad sets / line items" value={`${c.campaigns}`} />
      <Field label="Impressions served" value={c.impressions === '0' ? '—' : c.impressions} />
      <Field label="Usage type" value={c.usageType} />
    </div>

    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Governance Summary</p>
      <Field label="Approved platforms" value={c.platforms.join(', ')} />
      <Field label="Approved account labels" value="Approved Advertiser A–D" />
      <Field label="Sharing status" value={alerts.some((a) => a.cohort === c.name) ? 'Review flag raised' : 'No sharing detected'} />
      <Field label="Review flags" value={`${alerts.filter((a) => a.cohort === c.name).length}`} />
      <Field label="Last checked" value="13 Aug 2026, 10:30 AM IST" />
    </div>

    <div className="flex flex-wrap gap-2">
      <button onClick={onCampaigns} className="px-3 py-2 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600">View Campaign Usage</button>
      <button onClick={onGovernance} className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">View Governance</button>
      <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Download size={13} /> Export Summary</button>
    </div>
  </div>
);

export default SwiggyPartnerDashboard;
