import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
  useReducedMotion,
} from 'framer-motion';
import {
  Home,
  BarChart3,
  Radio,
  UsersRound,
  Handshake,
  TrendingUp,
  Megaphone,
  FileBarChart,
  Settings as SettingsIcon,
  ChevronLeft,
  Bell,
  HelpCircle,
  User as UserIcon,
  Compass,
  PlayCircle,
  UserCircle2,
  Briefcase,
  Wallet,
  ShoppingBag,
  Heart,
  Smartphone,
  Target,
  Crown,
  ArrowLeftRight,
  Crosshair,
  Gem,
  Shield,
  UserPlus,
  Landmark,
  ShoppingCart,
  Signal,
  AppWindow,
  Video,
  Plus,
  ArrowRight,
  Info,
} from 'lucide-react';

const ease = [0.22, 1, 0.36, 1] as const;

/* -------------------------- Sidebar -------------------------- */
const PlanningSidebar = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const items = [
    { icon: Home, label: 'Home', active: true },
    { icon: BarChart3, label: 'Planning', active: true },
    { icon: Radio, label: 'Signals' },
    { icon: UsersRound, label: 'Audiences', to: '/segmentation' },
    { icon: Handshake, label: 'Partners', to: '/partners/swiggy' },
    { icon: TrendingUp, label: 'Analytics' },
    { icon: Megaphone, label: 'Activations', to: '/activation' },
    { icon: FileBarChart, label: 'Reports' },
    { icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <motion.aside
      initial={{ x: -12, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease }}
      className={`${collapsed ? 'w-16' : 'w-56'} shrink-0 border-r border-slate-200 bg-white/60 backdrop-blur-sm transition-[width] duration-300`}
    >
      <div className="p-5 flex items-center gap-2">
        {!collapsed && (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-400 via-slate-500 to-slate-400 bg-clip-text text-transparent">
              WPP
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Data</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Exchange</span>
            </div>
          </div>
        )}
      </div>

      <nav className="px-3 space-y-1">
        {items.map((it) => (
          <button
            key={it.label}
            onClick={() => it.to && navigate(it.to)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              it.active
                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <it.icon size={18} strokeWidth={2} />
            {!collapsed && <span>{it.label}</span>}
          </button>
        ))}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mt-6 mx-3 flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-slate-700"
      >
        <ChevronLeft size={14} className={collapsed ? 'rotate-180 transition-transform' : 'transition-transform'} />
        {!collapsed && <span>Collapse</span>}
      </button>
    </motion.aside>
  );
};

/* -------------------------- Header -------------------------- */
const PlanningHeader = () => (
  <motion.header
    initial={{ y: -8, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.5, ease, delay: 0.1 }}
    className="flex items-center justify-between px-8 py-5 border-b border-slate-200/70 bg-white/40 backdrop-blur-sm"
  >
    <div className="flex items-center gap-3">
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-400 via-slate-500 to-slate-400 bg-clip-text text-transparent">
          WPP
        </span>
        <div className="flex flex-col leading-none">
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Data</span>
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Exchange</span>
        </div>
      </div>
      <span className="text-slate-300 mx-2">|</span>
      <span className="text-sm font-semibold text-slate-700">Planning</span>
    </div>
    <div className="flex items-center gap-4 text-slate-500">
      <button className="p-1.5 hover:text-slate-800 transition"><Bell size={18} /></button>
      <button className="p-1.5 hover:text-slate-800 transition"><HelpCircle size={18} /></button>
      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
        <UserIcon size={16} className="text-slate-500" />
      </div>
    </div>
  </motion.header>
);

/* -------------------------- Hero -------------------------- */
const signals = [
  { id: 'demographics', label: 'Demographics &\nBackground', sub: 'Who they are', icon: UserCircle2, attrs: ['Age', 'Gender', 'Family structure', 'Location'] },
  { id: 'affluence', label: 'Affluence &\nFinancial Intelligence', sub: 'What they can afford', icon: Wallet, attrs: ['Income proxies', 'Spend capacity', 'Financial behavior', 'Premium propensity'] },
  { id: 'purchase', label: 'Purchase &\nCommerce Behavior', sub: 'What they buy', icon: ShoppingBag, attrs: ['Retail & ecommerce', 'Quick commerce', 'Category consumption', 'Brand affinity'] },
  { id: 'psycho', label: 'Psychographics &\nLifestyle', sub: 'What motivates them', icon: Heart, attrs: ['Interests', 'Values', 'Life-stage indicators', 'Lifestyle preferences'] },
  { id: 'digital', label: 'Digital &\nApp Behavior', sub: 'How they engage', icon: Smartphone, attrs: ['App usage', 'Platform engagement', 'Digital intensity', 'Content consumption'] },
  { id: 'intent', label: 'Intent &\nIn-Market Signals', sub: 'What they are likely to do next', icon: Target, attrs: ['Purchase intent', 'Category interest', 'Upgrade signals', 'Life-event triggers'] },
];

const HeroSection = () => {
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);
  const [centerHover, setCenterHover] = useState(false);

  // Geometry — single source of truth so silhouette, ring, connectors, and cards all align.
  const SIZE = 620;
  const CENTER = SIZE / 2;
  const CARD_W = 200;
  const RADIUS = CENTER - 110; // leaves room so cards fit fully inside SIZE box

  const cardCount = 6;
  // Start at top, go clockwise.
  const angles = Array.from({ length: cardCount }, (_, i) => (-Math.PI / 2) + (i * (2 * Math.PI)) / cardCount);

  return (
    <section className="relative px-8 pt-10 pb-16 overflow-hidden">
      {/* Soft dotted background */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgb(148 163 184 / 0.18) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 90%)',
        }}
      />
      <div className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-blue-200/40 to-indigo-200/30 blur-3xl pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center max-w-[1400px] mx-auto">
        {/* Left: Text */}
        <div>
          <motion.h1
            className="text-5xl font-bold text-slate-900 leading-tight tracking-tight"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } } }}
          >
            <motion.span
              className="block"
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }}
            >
              One Audience Layer.
            </motion.span>
            <motion.span
              className="block"
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }}
            >
              Infinite Growth Opportunities.
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.7 }}
            className="mt-6 text-base text-slate-600 leading-relaxed max-w-xl"
          >
            Unify first-party data with real-world signals from fintech, commerce, quick commerce, telco, app intelligence, and media ecosystems to discover, activate, and measure high-value audiences across the customer lifecycle.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.95 }}
            className="mt-8 flex items-center gap-6"
          >
            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white hover:border-blue-300 hover:text-blue-700 text-sm font-medium text-slate-700 transition-all hover:shadow-sm">
              <Compass size={16} /> Explore Intelligence Layers
            </button>
            <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors">
              <PlayCircle size={18} /> Watch 60-sec walkthrough
            </button>
          </motion.div>
        </div>

        {/* Right: Audience ring */}
        <div className="relative flex items-center justify-center">
          <div className="relative" style={{ width: SIZE, height: SIZE }}>
            {/* SVG with rings + connectors */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              fill="none"
            >
              <motion.circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                stroke="rgb(99 102 241 / 0.18)"
                strokeWidth={1}
                strokeDasharray="3 6"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.4, ease, delay: 0.6 }}
              />
              <motion.circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS - 70}
                stroke="rgb(99 102 241 / 0.12)"
                strokeWidth={1}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease, delay: 0.8 }}
              />

              {/* Connector lines from center silhouette out to each card */}
              {angles.map((angle, i) => {
                const startR = 78;
                const endR = RADIUS - 8;
                const x1 = CENTER + Math.cos(angle) * startR;
                const y1 = CENTER + Math.sin(angle) * startR;
                const x2 = CENTER + Math.cos(angle) * endR;
                const y2 = CENTER + Math.sin(angle) * endR;
                const isActive = hovered === signals[i].id || centerHover;
                return (
                  <motion.line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isActive ? 'rgb(79 70 229 / 0.6)' : 'rgb(148 163 184 / 0.35)'}
                    strokeWidth={isActive ? 1.5 : 1}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.9, ease, delay: 1.0 + i * 0.12 }}
                  />
                );
              })}

              {!reduce && centerHover && angles.map((angle, i) => (
                <motion.circle
                  key={`p-${i}`}
                  r={3}
                  fill="rgb(79 70 229)"
                  initial={{ cx: CENTER + Math.cos(angle) * 78, cy: CENTER + Math.sin(angle) * 78, opacity: 0 }}
                  animate={{
                    cx: CENTER + Math.cos(angle) * (RADIUS - 8),
                    cy: CENTER + Math.sin(angle) * (RADIUS - 8),
                    opacity: [0, 1, 0],
                  }}
                  transition={{ duration: 1.2, ease, delay: i * 0.06 }}
                />
              ))}
            </svg>

            {/* Center silhouette — anchored to exact geometric center */}
            <motion.div
              onMouseEnter={() => setCenterHover(true)}
              onMouseLeave={() => setCenterHover(false)}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease, delay: 0.5 }}
              className="absolute z-10"
              style={{ left: CENTER, top: CENTER, transform: 'translate(-50%, -50%)' }}
            >
              <motion.div
                animate={centerHover ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 1.2, ease }}
                className="w-44 h-44 rounded-full bg-gradient-to-br from-blue-50 via-indigo-100 to-blue-100 border border-indigo-200/50 flex items-center justify-center shadow-[0_10px_40px_-15px_rgb(99_102_241_/_0.4)]"
              >
                <svg viewBox="0 0 120 120" className="w-28 h-28">
                  <defs>
                    <linearGradient id="silhouette-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#1e3a8a" />
                    </linearGradient>
                  </defs>
                  <g fill="url(#silhouette-grad)">
                    <circle cx="42" cy="40" r="14" />
                    <path d="M 22 110 Q 22 70 42 66 Q 62 70 62 110 Z" />
                  </g>
                  <g fill="url(#silhouette-grad)" opacity="0.85">
                    <circle cx="78" cy="40" r="14" />
                    <path d="M 58 110 Q 58 70 78 66 Q 98 70 98 110 Z" />
                  </g>
                </svg>
              </motion.div>
            </motion.div>

            {/* Floating signal cards positioned around circle */}
            {signals.map((sig, i) => {
              const angle = angles[i];
              const x = CENTER + Math.cos(angle) * RADIUS;
              const y = CENTER + Math.sin(angle) * RADIUS;
              const isHover = hovered === sig.id;
              const dim = hovered !== null && hovered !== sig.id;

              return (
                <motion.div
                  key={sig.id}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: dim ? 0.65 : 1, scale: 1, y: isHover ? -4 : 0 }}
                  transition={{ duration: 0.6, ease, delay: 1.0 + i * 0.12 }}
                  onMouseEnter={() => setHovered(sig.id)}
                  onMouseLeave={() => setHovered(null)}
                  className="absolute"
                  style={{
                    left: x,
                    top: y,
                    transform: 'translate(-50%, -50%)',
                    width: CARD_W,
                  }}
                >
                  <div className={`bg-white rounded-xl border ${isHover ? 'border-indigo-300 shadow-lg shadow-indigo-100/60' : 'border-slate-200 shadow-sm'} p-3.5 transition-all`}>
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <sig.icon size={16} className="text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold text-slate-900 leading-tight whitespace-pre-line">{sig.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{sig.sub}</div>
                      </div>
                    </div>
                    <AnimatePresence>
                      {isHover && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease }}
                          className="overflow-hidden"
                        >
                          <ul className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                            {sig.attrs.map((a) => (
                              <li key={a} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-blue-500" /> {a}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

/* -------------------------- Count-up -------------------------- */
const CountUp = ({ to, suffix = '', duration = 1.2 }: { to: number; suffix?: string; duration?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => {
    if (to >= 1000000) return `${(v / 1000000).toFixed(0)}M`;
    if (to >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return `${Math.round(v)}`;
  });
  const [text, setText] = useState('0');

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setText(to >= 1000000 ? `${(to / 1000000).toFixed(0)}M` : to >= 1000 ? `${(to / 1000).toFixed(1).replace(/\.0$/, '')}K` : `${to}`);
      return;
    }
    const controls = animate(mv, to, { duration, ease });
    const unsub = display.on('change', (v) => setText(v));
    return () => { controls.stop(); unsub(); };
  }, [inView, to, duration, mv, display, reduce]);

  return <span ref={ref}>{text}{suffix}</span>;
};

/* -------------------------- Metric strip -------------------------- */
const metrics = [
  { value: 350000000, suffix: '+', label: 'Addressable Consumers', icon: UsersRound },
  { value: 2000, suffix: '+', label: 'Behavioral & Intent Signals', icon: Signal },
  { value: 10, suffix: '+', label: 'Industry Ecosystems', icon: Landmark },
  { value: 6, suffix: '', label: 'Audience Intelligence Layers', icon: BarChart3 },
];

const MetricStrip = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  return (
    <section ref={ref} className="px-8 max-w-[1400px] mx-auto -mt-2">
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {inView && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.6, ease, delay: 0.2 }}
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-blue-50/60 to-transparent pointer-events-none"
          />
        )}
        <div className="grid grid-cols-2 md:grid-cols-4">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease, delay: i * 0.1 }}
              className={`flex items-center gap-4 px-6 py-7 ${i > 0 ? 'border-l border-slate-100' : ''}`}
            >
              <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center">
                <m.icon size={18} className="text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">
                  <CountUp to={m.value} suffix={m.suffix} />
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{m.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* -------------------------- Intelligence Layers -------------------------- */
const layers = [
  { num: 1, title: 'Demographics &\nBackground', icon: UserCircle2, items: ['Age, gender', 'Family structure', 'Location'] },
  { num: 2, title: 'Affluence &\nFinancial Intelligence', icon: Wallet, items: ['Income proxies', 'Spend capacity', 'Financial behavior', 'Premium propensity'] },
  { num: 3, title: 'Purchase &\nCommerce Behavior', icon: ShoppingBag, items: ['Retail & ecommerce', 'Quick commerce', 'Category consumption', 'Brand affinity'] },
  { num: 4, title: 'Psychographics\nLifestyle', icon: Heart, items: ['Interests', 'Values', 'Life-stage indicators', 'Lifestyle preferences'] },
  { num: 5, title: 'Digital &\nApp Behavior', icon: Smartphone, items: ['App usage', 'Platform engagement', 'Digital intensity', 'Content consumption'] },
  { num: 6, title: 'Intent &\nIn-Market Signals', icon: Target, items: ['Purchase intent', 'Category interest', 'Upgrade signals', 'Life-event triggers'] },
];

const IntelligenceLayers = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  return (
    <section ref={ref} className="px-8 max-w-[1400px] mx-auto mt-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease }}
          className="text-xl font-bold text-slate-900"
        >
          Audience Intelligence Powered by Real-World Consumer Behavior
        </motion.h2>
        <p className="text-sm text-slate-500 mt-2">
          Move beyond demographics and platform-level interactions to understand how consumers spend, shop, engage, travel, consume content, and transact across ecosystems.
        </p>
        <div className="mt-7 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {layers.map((l, i) => (
            <motion.div
              key={l.num}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease, delay: 0.1 + i * 0.07 }}
              whileHover={{ y: -3 }}
              className="group rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md hover:shadow-blue-100/40 p-4 transition-all bg-white"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                <l.icon size={16} className="text-blue-600" />
              </div>
              <div className="mt-3 text-sm font-semibold text-slate-900 whitespace-pre-line leading-tight">
                {l.num}. {l.title}
              </div>
              <ul className="mt-3 space-y-1.5">
                {l.items.map((it) => (
                  <li key={it} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    {it}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* -------------------------- Growth Audiences -------------------------- */
const audiences = [
  { icon: Crown, label: 'High CLTV\nConsumers', tip: 'Prioritize users with higher long-term value' },
  { icon: ArrowLeftRight, label: 'Competitive\nSwitchers', tip: 'Find users likely to switch brands' },
  { icon: Crosshair, label: 'Category\nIntenders', tip: 'Identify active category demand' },
  { icon: Gem, label: 'Premium Affluent\nAudiences', tip: 'Target premium-ready consumers' },
  { icon: Shield, label: 'Churn Risk\nSegments', tip: 'Detect declining engagement' },
  { icon: UserPlus, label: 'New-to-Brand\nProspects', tip: 'Expand into fresh audience pools' },
];

const GrowthAudiences = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  return (
    <section ref={ref} className="px-8 max-w-[1400px] mx-auto mt-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease }}
          className="text-xl font-bold text-slate-900"
        >
          From Signals to Growth Audiences
        </motion.h2>
        <p className="text-sm text-slate-500 mt-2">
          Combine multiple intelligence layers to identify high-value audiences that drive real business outcomes.
        </p>
        <div className="mt-7 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {audiences.map((a, i) => (
            <motion.button
              key={a.label}
              initial={{ opacity: 0, x: -16 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, ease, delay: i * 0.06 }}
              whileHover={{ y: -3 }}
              className="group relative rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md hover:shadow-blue-100/40 p-4 flex items-start gap-3 text-left transition-all bg-white"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                <a.icon size={16} className="text-blue-600" />
              </div>
              <div className="text-sm font-semibold text-slate-900 whitespace-pre-line leading-tight">{a.label}</div>
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                {a.tip}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

/* -------------------------- Intelligence Ecosystem -------------------------- */
const ecosystems = [
  { icon: Landmark, title: 'Fintech & Payments', desc: 'Transaction behavior, spend intelligence, financial signals', logos: ['slice', 'CRED', 'paytm'] },
  { icon: ShoppingCart, title: 'Commerce &\nQuick Commerce', desc: 'Purchase behavior, category affinity, shopping patterns', logos: ['amazon', 'Flipkart', 'zepto'] },
  { icon: Signal, title: 'Telco & Mobility', desc: 'Reach, mobility, device and connectivity intelligence', logos: ['Jio', 'airtel', 'Vi'] },
  { icon: AppWindow, title: 'App & Digital\nIntelligence', desc: 'Engagement, intent, and digital behavior signals', logos: ['AppsFlyer', 'TEALIUM'] },
  { icon: Video, title: 'Media & Publisher\nEcosystems', desc: 'Content consumption and audience interests', logos: ['ZEE', 'NDTV', 'MX Player'] },
];

const IntelligenceEcosystem = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  return (
    <section ref={ref} className="px-8 max-w-[1400px] mx-auto mt-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 relative overflow-hidden">
        {/* Subtle horizontal data flow line */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-blue-200/40 to-transparent pointer-events-none" />

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease }}
          className="text-xl font-bold text-slate-900 relative"
        >
          Intelligence Ecosystem
        </motion.h2>
        <p className="text-sm text-slate-500 mt-2 relative">
          Powered by leading partners across key consumer ecosystems.
        </p>
        <div className="mt-7 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 relative">
          {ecosystems.map((e, i) => (
            <motion.div
              key={e.title}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, ease, delay: 0.1 + i * 0.08 }}
              className="group rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md hover:shadow-blue-100/40 p-4 bg-white transition-all"
            >
              <div className="flex items-start gap-2.5">
                <div className="relative w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <e.icon size={16} className="text-blue-600" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-60" />
                  </span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 whitespace-pre-line leading-tight group-hover:text-slate-950">{e.title}</div>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-slate-500 group-hover:text-slate-700 transition-colors leading-relaxed">{e.desc}</p>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                {e.logos.map((l) => (
                  <span key={l} className="text-[11px] text-slate-400 group-hover:text-slate-700 font-medium transition-colors">{l}</span>
                ))}
                <button className="ml-auto w-5 h-5 rounded-full border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 flex items-center justify-center transition-colors">
                  <Plus size={11} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* -------------------------- Sparkline -------------------------- */
const Sparkline = ({ color, animate: shouldAnimate }: { color: string; animate: boolean }) => {
  const points = '0,18 8,14 16,16 24,10 32,12 40,6 48,8 56,4 64,7 72,3';
  return (
    <svg viewBox="0 0 72 22" className="w-full h-6">
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={shouldAnimate ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.2, ease }}
      />
    </svg>
  );
};

const sectors = [
  { name: 'CPG', value: 400, color: '#3b82f6' },
  { name: 'BFSI', value: 350, color: '#10b981' },
  { name: 'Auto', value: 250, color: '#f59e0b' },
  { name: 'Travel &\nHospitality', value: 180, color: '#8b5cf6' },
  { name: 'Fashion &\nBeauty', value: 160, color: '#ec4899' },
  { name: 'Consumer\nElectronics', value: 140, color: '#06b6d4' },
  { name: 'Education', value: 90, color: '#14b8a6' },
];

const AudienceScale = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  return (
    <section ref={ref} className="px-8 max-w-[1400px] mx-auto mt-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-start justify-between">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease }}
              className="text-xl font-bold text-slate-900"
            >
              Audience Scale by Sector
            </motion.h2>
            <p className="text-sm text-slate-500 mt-2">
              Plan with confidence using our sector-wise addressable audience universe.
            </p>
          </div>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Info size={11} /> All numbers are approximate
          </span>
        </div>
        <div className="mt-7 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {sectors.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease, delay: 0.1 + i * 0.07 }}
              whileHover={{ y: -2 }}
              className="group rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md hover:shadow-blue-100/40 p-5 bg-white transition-all relative flex flex-col items-start"
            >
              <div
                className="text-4xl font-extrabold tabular-nums tracking-tight"
                style={{ color: s.color }}
              >
                <CountUp to={s.value} suffix="M" duration={1.6} />
              </div>
              <div className="mt-2 text-[11px] text-slate-500 font-medium uppercase tracking-wide whitespace-pre-line leading-tight">{s.name}</div>
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-slate-900 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Planning universe
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* -------------------------- Partner Strips -------------------------- */
const availablePartners = ['slice', 'CRED', 'paytm', 'amazon', 'Flipkart', 'zepto', 'Jio', 'airtel', 'Vi', 'AppsFlyer', 'TEALIUM', 'ZEE', 'NDTV', 'MX Player'];
const comingSoon = ['PhonePe', 'navi', 'TATA 1mg', 'meesho', 'bigbasket', 'dunzo', 'Disney+ hotstar', 'Spotify', 'ShareChat'];

const PartnerStrip = ({ label, items, muted = false }: { label: string; items: string[]; muted?: boolean }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <div ref={ref} className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4 flex items-center gap-6">
      <div className="text-xs font-semibold text-slate-500 shrink-0 w-32">{label}</div>
      <div className="flex-1 flex flex-wrap items-center gap-x-6 gap-y-2">
        {items.map((it, i) => (
          <motion.span
            key={it}
            initial={{ opacity: 0, x: -10 }}
            animate={inView ? { opacity: muted ? 0.45 : 1, x: 0 } : {}}
            transition={{ duration: 0.4, ease, delay: i * 0.04 }}
            className={`text-sm font-medium relative group ${muted ? 'text-slate-400' : 'text-slate-700'}`}
          >
            {it}
            {muted && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-slate-900 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Coming soon
              </span>
            )}
          </motion.span>
        ))}
      </div>
      <button className="shrink-0 w-7 h-7 rounded-full border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 flex items-center justify-center transition-colors group relative">
        <Plus size={13} />
        <span className="absolute -top-8 right-0 px-2 py-1 rounded bg-slate-900 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">View all partners</span>
      </button>
    </div>
  );
};

/* -------------------------- Bottom CTA -------------------------- */
const BottomCTA = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const navigate = useNavigate();
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease }}
      className="px-8 max-w-[1400px] mx-auto mt-6 mb-10"
    >
      <div className="relative rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-indigo-50/70 to-white px-8 py-7 flex items-center justify-between overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgb(99 102 241 / 0.15) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            maskImage: 'radial-gradient(ellipse at left, black 30%, transparent 80%)',
          }}
        />
        <div className="relative">
          <h3 className="text-xl font-bold text-slate-900">Plan smarter. Grow bigger. Measure what matters.</h3>
          <p className="text-sm text-slate-600 mt-1">Plan audiences by sector, signal, partner, reach, overlap, and activation potential.</p>
        </div>
        <motion.button
          onClick={() => navigate('/planner')}
          whileHover={{ y: -2 }}
          className="group relative flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md hover:shadow-xl hover:shadow-blue-200/60 transition-all"
        >
          Start Audience Planning
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </motion.button>
      </div>
    </motion.section>
  );
};

/* -------------------------- Main Page -------------------------- */
const PlanningPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 text-slate-900 font-sans">
      <div className="flex">
        <PlanningSidebar />
        <div className="flex-1 min-w-0">
          <PlanningHeader />
          <HeroSection />
          <MetricStrip />
          <IntelligenceLayers />
          <GrowthAudiences />
          <IntelligenceEcosystem />
          <AudienceScale />
          <div className="px-8 max-w-[1400px] mx-auto mt-6 space-y-3">
            <PartnerStrip label="Available Data Partners" items={availablePartners} />
            <PartnerStrip label="Coming Soon" items={comingSoon} muted />
          </div>
          <BottomCTA />
        </div>
      </div>
    </div>
  );
};

export default PlanningPage;
