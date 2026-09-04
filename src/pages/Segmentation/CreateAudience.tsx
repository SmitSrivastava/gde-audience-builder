
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Code, Plus, Trash2, Info, Save, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { allAudiences, audienceQueryConfigs, defaultQueryConfig, ALL_PARTNERS, fieldToPartners } from '@/data/audiences';
import { useSavedAudiences } from '@/contexts/SavedAudiencesContext';
import { supabase } from '@/integrations/supabase/client';

interface QueryRule { id: string; field: string; operator: string; value: string; logic: 'AND' | 'OR'; }

const ALL_FIELDS = [
  'Age', 'Gender', 'City', 'State', 'Tier', 'Income Level',
  'OTT Apps Installed', 'OTT Engagement Level', 'Preferred OTT Platform',
  'Genre Affinity', 'Device Type', 'Device Tier', 'Profession',
  'Industry', 'Household Type', 'Family Structure'
];

const PROFESSION_VALUES = [
  'Entrepreneurs', 'Consultants', 'Finance Professionals', 'MBA Graduates',
  'Family Business Owners', 'Startup Founders', 'Senior Corporate Executives',
  'SME Business Owners', 'Investment Professionals', 'Chartered Accountants',
  'Teachers', 'Engineers', 'Doctors', 'Govt Employee', 'Bank Employee'
];

const GENRE_VALUES = [
  'Drama', 'Business Drama', 'Family Drama', 'Crime Thriller',
  'Documentary', 'Premium Series', 'Action', 'Romance'
];

const OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN', 'BETWEEN', 'CONTAINS'];

const MultiSelectDropdown = ({ options, selected, onChange, placeholder }: { options: string[]; selected: string[]; onChange: (v: string[]) => void; placeholder: string }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter(x => x !== val) : [...selected, val]);
  };

  return (
    <div ref={ref} className="relative flex-1 min-w-[200px]">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground text-left flex items-center justify-between">
        <span className={selected.length ? 'text-foreground' : 'text-muted-foreground'}>
          {selected.length ? `${selected.length} selected` : placeholder}
        </span>
        <span className="text-muted-foreground text-xs">▼</span>
      </button>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selected.map(s => (
            <span key={s} className="px-2 py-0.5 rounded text-xs bg-primary/15 text-primary border border-primary/30">{s}</span>
          ))}
        </div>
      )}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-2 px-3 py-2 hover:bg-secondary/50 cursor-pointer text-sm text-foreground">
              <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} className="accent-[hsl(0,85%,50%)]" />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const CreateAudience = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const audienceId = searchParams.get('audience');
  const { addAudience, savedAudiences } = useSavedAudiences();

  // Check saved audiences too
  const matchedAudience = useMemo(() => {
    return allAudiences.find(a => a.id === audienceId) || savedAudiences.find(a => a.id === audienceId);
  }, [audienceId, savedAudiences]);

  // If saved audience has stored queryRules, use those; otherwise fall back to config
  const queryConfig = useMemo(() => {
    if (matchedAudience?.queryRules) {
      // Build from stored rules
      return {
        dataPartners: defaultQueryConfig.dataPartners,
        conditions: matchedAudience.queryRules,
        sql: '',
      };
    }
    return (audienceId && audienceQueryConfigs[audienceId]) || defaultQueryConfig;
  }, [audienceId, matchedAudience]);

  const [queryRules, setQueryRules] = useState<QueryRule[]>(
    audienceId ? queryConfig.conditions.map((c, i) => ({ id: String(i + 1), field: c.field, operator: c.operator, value: c.value, logic: c.logic || 'AND' as const })) : [{ id: '1', field: '', operator: '', value: '', logic: 'AND' }]
  );

  // Derive highlighted partners from fields used in query rules
  const highlightedPartners = useMemo(() => {
    const partners = new Set<string>();
    queryRules.forEach(r => {
      if (r.field && fieldToPartners[r.field]) {
        fieldToPartners[r.field].forEach(p => partners.add(p));
      }
    });
    return partners;
  }, [queryRules]);

  // Generate SQL from query rules
  const sqlQuery = useMemo(() => {
    if (queryRules.length === 0) return 'SELECT user_id FROM audience_data';
    const conditions = queryRules.filter(r => r.field && r.operator && r.value).map((r, i) => {
      const prefix = i === 0 ? 'WHERE' : `  ${r.logic}`;
      const field = r.field.toLowerCase().replace(/\s+/g, '_');
      if (r.operator === 'IN' || r.operator === 'NOT IN') {
        const vals = r.value.split(',').map(v => `'${v.trim()}'`).join(', ');
        return `${prefix} ${field} ${r.operator} (${vals})`;
      }
      if (r.operator === 'BETWEEN') {
        const parts = r.value.split('-').map(v => v.trim());
        return `${prefix} ${field} BETWEEN ${parts[0]} AND ${parts[1] || parts[0]}`;
      }
      if (r.operator === 'CONTAINS') {
        const vals = r.value.split(',').map(v => `'${v.trim()}'`).join(', ');
        return `${prefix} ${field} IN (${vals})`;
      }
      return `${prefix} ${field} ${r.operator} '${r.value}'`;
    });
    return `SELECT user_id, demographic_segment, ott_profile, device_info\nFROM telco_data t\nJOIN ott_analytics o ON t.device_id = o.device_id\nJOIN device_intel d ON t.device_id = d.device_id\n${conditions.join('\n')}`;
  }, [queryRules]);

  const [audienceName, setAudienceName] = useState(matchedAudience?.name || '');
  const [isCreating, setIsCreating] = useState(false);
  const [queryRun, setQueryRun] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [resultSize, setResultSize] = useState('14.2M');
  const [resultSizeNum, setResultSizeNum] = useState(14200000);

  // AI natural-language cohort builder
  const [nlPrompt, setNlPrompt] = useState('');
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [catalogFields, setCatalogFields] = useState<string[]>([]);

  useEffect(() => {
    supabase.from('attribute_catalog').select('field').limit(2000).then(({ data }) => {
      if (data) setCatalogFields([...new Set(data.map(d => d.field))]);
    });
  }, []);

  const fieldOptions = useMemo(() => {
    return [...new Set([...ALL_FIELDS, ...catalogFields])];
  }, [catalogFields]);

  useEffect(() => {
    if (matchedAudience) {
      setAudienceName(matchedAudience.name);
      // If a saved audience with queryRules, reload them
      if (matchedAudience.queryRules) {
        setQueryRules(matchedAudience.queryRules.map((c, i) => ({ id: String(i + 1), field: c.field, operator: c.operator, value: c.value, logic: c.logic || 'AND' })));
      }
    }
  }, [matchedAudience]);

  const addQueryRule = () => {
    setQueryRules([...queryRules, { id: Date.now().toString(), field: '', operator: '', value: '', logic: 'AND' }]);
  };
  const removeQueryRule = (id: string) => { setQueryRules(queryRules.filter(r => r.id !== id)); };
  const updateQueryRule = (id: string, updates: Partial<QueryRule>) => {
    setQueryRules(queryRules.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleRunQuery = (rules: QueryRule[] = queryRules) => {
    setIsRunning(true);
    setQueryRun(false);
    // Simulate different size based on conditions
    const hasProfession = rules.some(r => r.field === 'Profession' && r.value);
    const hasAge = rules.some(r => r.field === 'Age' && r.value);
    let size = matchedAudience?.sizeNum || 14200000;
    if (hasProfession) size = Math.round(size * 0.6);
    if (hasAge) size = Math.round(size * 0.95);
    // Each additional filled rule narrows the cohort
    const extraRules = rules.filter(r => r.field && r.value && r.field !== 'Profession' && r.field !== 'Age').length;
    size = Math.round(size * Math.pow(0.8, extraRules));
    const sizeM = (size / 1000000).toFixed(1);
    setTimeout(() => {
      setIsRunning(false);
      setQueryRun(true);
      setResultSize(`${sizeM}M`);
      setResultSizeNum(size);
    }, 2500);
  };

  const handleInterpret = async () => {
    if (!nlPrompt.trim()) return;
    setIsInterpreting(true);
    setAiSummary('');
    try {
      const { data, error } = await supabase.functions.invoke('interpret-cohort', {
        body: { prompt: nlPrompt.trim() },
      });
      if (error) {
        const msg = (data as { error?: string } | null)?.error || error.message || 'AI interpretation failed';
        throw new Error(msg);
      }
      const result = data as { rules: { field: string; operator: string; value: string; logic: 'AND' | 'OR' }[]; summary: string };
      const rules: QueryRule[] = result.rules.map((r, i) => ({
        id: String(Date.now() + i),
        field: r.field,
        operator: r.operator,
        value: r.value,
        logic: r.logic,
      }));
      setQueryRules(rules);
      setAiSummary(result.summary);
      toast({ title: 'Cohort interpreted', description: result.summary });
      // Auto-run the query to estimate cohort size
      handleRunQuery(rules);
    } catch (e) {
      toast({ title: 'Could not interpret', description: e instanceof Error ? e.message : 'Try rephrasing your description.', variant: 'destructive' });
    } finally {
      setIsInterpreting(false);
    }
  };

  const handleCreateAudience = async () => {
    if (!audienceName.trim()) { toast({ title: "Error", description: "Please enter an audience name", variant: "destructive" }); return; }
    setIsCreating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const usedAttributes = queryRules.filter(r => r.field).map(r => r.field);
      const uniqueAttrs = [...new Set(usedAttributes)];

      const newAudience = {
        id: audienceName.toLowerCase().replace(/\s+/g, '-'),
        name: audienceName,
        size: queryRun ? `~${resultSize}` : '~14.2M',
        sizeNum: queryRun ? resultSizeNum : 14200000,
        activationPlatforms: ['Meta', 'Google', 'DV360', 'YouTube'],
        status: 'Active' as const,
        created: '2026-04-04',
        attributes: uniqueAttrs.length > 0 ? uniqueAttrs : (matchedAudience?.attributes || []),
        queryRules: queryRules.filter(r => r.field).map(r => ({ field: r.field, operator: r.operator, value: r.value, logic: r.logic })),
      };
      addAudience(newAudience);
      toast({ title: "Audience Saved", description: `"${audienceName}" saved successfully` });
      navigate('/segmentation');
    } catch { toast({ title: "Error", description: "Failed to save audience.", variant: "destructive" }); }
    finally { setIsCreating(false); }
  };

  const renderValueInput = (rule: QueryRule) => {
    if (rule.field === 'Profession' && (rule.operator === 'CONTAINS' || rule.operator === 'IN')) {
      const selected = rule.value ? rule.value.split(', ').filter(Boolean) : [];
      return <MultiSelectDropdown options={PROFESSION_VALUES} selected={selected} onChange={(v) => updateQueryRule(rule.id, { value: v.join(', ') })} placeholder="Select professions..." />;
    }
    if (rule.field === 'Genre Affinity') {
      const selected = rule.value ? rule.value.split(', ').filter(Boolean) : [];
      return <MultiSelectDropdown options={GENRE_VALUES} selected={selected} onChange={(v) => updateQueryRule(rule.id, { value: v.join(', ') })} placeholder="Select genres..." />;
    }
    return (
      <input type="text" value={rule.value} onChange={(e) => updateQueryRule(rule.id, { value: e.target.value })}
        className="flex-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground" placeholder="Value" />
    );
  };

  // Right panel data
  const selectedAttrs = [...new Set(queryRules.filter(r => r.field).map(r => r.field))];
  const matchingPartners = [...highlightedPartners];

  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">
              {matchedAudience ? matchedAudience.name : 'Create Audience'}
            </h1>
            {matchedAudience && (
              <span className="pill-chip text-xs">Pre-built Audience Template</span>
            )}
          </div>
          <p className="text-muted-foreground">Build custom audience segments using data partner datasets</p>
        </div>

        {/* Data Partner Selection */}
        <div className="bg-card rounded-xl p-6 neon-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Data Partners</h3>
          <div className="flex flex-wrap gap-3">
            {ALL_PARTNERS.map(partner => (
              <div key={partner}
                className={`px-4 py-2 rounded-lg border text-sm transition-all ${highlightedPartners.has(partner) ? 'bg-primary/15 border-primary/50 text-primary' : 'border-border text-muted-foreground/40'}`}
              >{partner}</div>
            ))}
          </div>
        </div>

        {/* Visual Query Builder */}
        <div className="bg-card rounded-xl p-6 neon-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Query Conditions</h3>
            <button onClick={addQueryRule} className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors">
              <Plus size={16} /> Add Condition
            </button>
          </div>
          <div className="space-y-3">
            {queryRules.map((rule, index) => (
              <div key={rule.id} className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg flex-wrap">
                {index > 0 && (
                  <select value={rule.logic} onChange={(e) => updateQueryRule(rule.id, { logic: e.target.value as 'AND' | 'OR' })} className="px-2 py-2 text-xs bg-card border border-border rounded text-foreground">
                    <option value="AND">AND</option><option value="OR">OR</option>
                  </select>
                )}
                <select value={rule.field} onChange={(e) => updateQueryRule(rule.id, { field: e.target.value, value: '' })} className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground min-w-[180px]">
                  <option value="">Select field...</option>
                  {fieldOptions.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                {rule.field && (
                  <select value={rule.operator} onChange={(e) => updateQueryRule(rule.id, { operator: e.target.value })} className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground">
                    <option value="">Select operator...</option>
                    {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                )}
                {rule.field && rule.operator && renderValueInput(rule)}
                <button onClick={() => removeQueryRule(rule.id)} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* SQL Editor */}
        <div className="bg-card rounded-xl p-6 neon-border">
          <div className="flex items-center gap-2 mb-4">
            <Code size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">SQL Editor</h3>
          </div>
          <pre className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm font-mono text-foreground whitespace-pre-wrap overflow-x-auto min-h-[120px]">{sqlQuery}</pre>
        </div>

        {/* Run Query */}
        <div className="bg-card rounded-xl p-6 neon-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Run Query</h3>
            <button onClick={handleRunQuery} disabled={isRunning}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isRunning ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}>
              <Play size={16} /> {isRunning ? 'Running...' : 'Run Query'}
            </button>
          </div>
          {!queryRun && !isRunning && (
            <p className="text-sm text-muted-foreground">Run query to calculate audience size</p>
          )}
          {isRunning && (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-muted-foreground">Processing query...</span>
            </div>
          )}
          {queryRun && (
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-secondary/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-primary">{resultSize}</div>
                <div className="text-sm text-muted-foreground">Audience Size</div>
              </div>
              <div className="bg-secondary/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-foreground">52 seconds</div>
                <div className="text-sm text-muted-foreground">Processing Time</div>
              </div>
            </div>
          )}
        </div>

        {/* Save */}
        <div className="bg-card rounded-xl p-6 neon-border">
          <div className="flex items-center gap-4">
            <input type="text" value={audienceName} onChange={(e) => setAudienceName(e.target.value)} placeholder="Enter audience name..."
              className="flex-1 px-4 py-3 border border-border bg-background rounded-lg focus:ring-2 focus:ring-primary/50 text-foreground" />
            <button onClick={handleCreateAudience} disabled={isCreating || !audienceName.trim()}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${isCreating || !audienceName.trim() ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}
            >
              <Save size={16} />
              {isCreating ? 'Saving...' : 'Save Audience'}
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - only show when fields are selected */}
      {selectedAttrs.length > 0 && (
        <div className="w-80 shrink-0 space-y-4">
          <div className="bg-card rounded-xl p-5 neon-border sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <Info size={18} className="text-primary" />
              <h3 className="font-semibold text-foreground">Audience Intelligence</h3>
            </div>
            <div className="space-y-4">
              {/* Why This Audience Matters */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Why This Audience Matters</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {matchedAudience ? `${matchedAudience.name} represent the highest-value acquisition cohort for Netflix India — high disposable income, multi-OTT behavior, and premium device ownership indicate strong conversion potential.` : 'This audience segment shows strong potential based on selected attributes — high engagement signals and targetable demographics make it ideal for precision campaigns.'}
                </p>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Affluence Index</div>
                  <div className="text-lg font-bold text-foreground">High</div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">OTT Engagement</div>
                  <div className="text-lg font-bold text-foreground">High</div>
                </div>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground mb-1">Conversion Potential</div>
                <div className="text-lg font-bold text-primary">Very High</div>
              </div>

              {/* Selected Attributes */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Selected Attributes</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAttrs.map((s, i) => <span key={i} className="pill-chip text-xs">{s}</span>)}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Matching Data Partners</h4>
                <div className="flex flex-wrap gap-1.5">
                  {matchingPartners.length > 0 ? matchingPartners.map((p, i) => <span key={i} className="px-2 py-1 bg-secondary/50 text-xs text-foreground rounded">{p}</span>) :
                    <span className="text-xs text-muted-foreground">Add conditions to see partners</span>}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Available Activation Platforms</h4>
                <div className="flex flex-wrap gap-1.5">
                  {['Meta Ads', 'Google Ads', 'DV360', 'YouTube'].map((p, i) => <span key={i} className="px-2 py-1 bg-secondary/50 text-xs text-foreground rounded">{p}</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateAudience;
