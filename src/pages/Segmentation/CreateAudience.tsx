
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Code, Plus, Trash2, Info, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { allAudiences, audienceQueryConfigs, defaultQueryConfig } from '@/data/audiences';
import { useSavedAudiences } from '@/contexts/SavedAudiencesContext';

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
  'SME Business Owners', 'Investment Professionals', 'Chartered Accountants'
];

const GENRE_VALUES = [
  'Drama', 'Business Drama', 'Family Drama', 'Crime Thriller',
  'Documentary', 'Premium Series', 'Action', 'Romance'
];

const OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN', 'BETWEEN', 'CONTAINS'];

const ALL_PARTNERS = [
  'Telco Data Provider', 'OTT App Analytics', 'Device Intelligence Corp',
  'Financial Proxy Signals', 'Content Affinity Engine', 'Engagement Depth Platform',
  'Professional Data Partner', 'Geo Intelligence Partner'
];

const CreateAudience = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const audienceId = searchParams.get('audience');
  const { addAudience } = useSavedAudiences();

  const matchedAudience = useMemo(() => allAudiences.find(a => a.id === audienceId), [audienceId]);
  const queryConfig = useMemo(() => (audienceId && audienceQueryConfigs[audienceId]) || defaultQueryConfig, [audienceId]);

  const [selectedPartners] = useState<string[]>(queryConfig.dataPartners);
  const [queryRules, setQueryRules] = useState<QueryRule[]>(
    queryConfig.conditions.map((c, i) => ({ id: String(i + 1), field: c.field, operator: c.operator, value: c.value, logic: 'AND' as const }))
  );
  const [sqlQuery, setSqlQuery] = useState(queryConfig.sql);
  const [audienceName, setAudienceName] = useState(matchedAudience?.name || '');
  const [isCreating, setIsCreating] = useState(false);
  const [queryRun, setQueryRun] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (matchedAudience) {
      setAudienceName(matchedAudience.name);
    }
  }, [matchedAudience]);

  const addQueryRule = () => {
    setQueryRules([...queryRules, { id: Date.now().toString(), field: '', operator: '', value: '', logic: 'AND' }]);
  };
  const removeQueryRule = (id: string) => { setQueryRules(queryRules.filter(r => r.id !== id)); };
  const updateQueryRule = (id: string, updates: Partial<QueryRule>) => {
    setQueryRules(queryRules.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleRunQuery = () => {
    setIsRunning(true);
    setQueryRun(false);
    setTimeout(() => {
      setIsRunning(false);
      setQueryRun(true);
    }, 2500);
  };

  const handleCreateAudience = async () => {
    if (!audienceName.trim()) { toast({ title: "Error", description: "Please enter an audience name", variant: "destructive" }); return; }
    setIsCreating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Gather attributes from query rules
      const usedAttributes = queryRules.filter(r => r.field).map(r => r.field);
      const uniqueAttrs = [...new Set(usedAttributes)];

      const newAudience = {
        id: audienceName.toLowerCase().replace(/\s+/g, '-'),
        name: audienceName,
        size: '~14.2M',
        sizeNum: 14200000,
        enrichmentStatus: 'Ready' as const,
        activationPlatforms: ['Meta', 'Google', 'DV360', 'YouTube'],
        status: 'Active' as const,
        created: new Date().toISOString().split('T')[0],
        enriched: false,
        signals: [],
        attributes: uniqueAttrs.length > 0 ? uniqueAttrs : (matchedAudience?.attributes || []),
      };
      addAudience(newAudience);
      toast({ title: "Audience Saved", description: `"${audienceName}" saved successfully` });
      navigate('/segmentation');
    } catch { toast({ title: "Error", description: "Failed to save audience.", variant: "destructive" }); }
    finally { setIsCreating(false); }
  };

  const insights = queryConfig.insights;

  // Multi-select state for profession and genre fields
  const renderValueInput = (rule: QueryRule) => {
    if (rule.field === 'Profession' && (rule.operator === 'CONTAINS' || rule.operator === 'IN')) {
      const selected = rule.value ? rule.value.split(', ').filter(Boolean) : [];
      return (
        <div className="flex-1 flex flex-wrap gap-1.5 min-w-[200px]">
          {PROFESSION_VALUES.map(p => (
            <button key={p} onClick={() => {
              const newSel = selected.includes(p) ? selected.filter(x => x !== p) : [...selected, p];
              updateQueryRule(rule.id, { value: newSel.join(', ') });
            }}
              className={`px-2 py-1 rounded text-xs transition-all ${selected.includes(p) ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground border border-border'}`}
            >{p}</button>
          ))}
        </div>
      );
    }
    if (rule.field === 'Genre Affinity') {
      const selected = rule.value ? rule.value.split(', ').filter(Boolean) : [];
      return (
        <div className="flex-1 flex flex-wrap gap-1.5 min-w-[200px]">
          {GENRE_VALUES.map(g => (
            <button key={g} onClick={() => {
              const newSel = selected.includes(g) ? selected.filter(x => x !== g) : [...selected, g];
              updateQueryRule(rule.id, { value: newSel.join(', ') });
            }}
              className={`px-2 py-1 rounded text-xs transition-all ${selected.includes(g) ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground border border-border'}`}
            >{g}</button>
          ))}
        </div>
      );
    }
    return (
      <input type="text" value={rule.value} onChange={(e) => updateQueryRule(rule.id, { value: e.target.value })}
        className="flex-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground" placeholder="Value" />
    );
  };

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">
              {matchedAudience ? matchedAudience.name : 'Create Audience'}
            </h1>
            {matchedAudience && (
              <>
                <span className="pill-chip text-xs">Pre-built Audience Template</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/30">Acquisition</span>
              </>
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
                className={`px-4 py-2 rounded-lg border text-sm ${selectedPartners.includes(partner) ? 'bg-primary/15 border-primary/50 text-primary' : 'border-border text-muted-foreground/40'}`}
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
                  {ALL_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
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
          <textarea value={sqlQuery} onChange={(e) => setSqlQuery(e.target.value)}
            className="w-full h-48 px-4 py-3 bg-background border border-border rounded-lg text-sm font-mono resize-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-foreground" />
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
                <div className="text-3xl font-bold text-primary">14.2M</div>
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

      {/* Right Panel - Audience Intelligence */}
      <div className="w-80 shrink-0 space-y-4">
        <div className="bg-card rounded-xl p-5 neon-border sticky top-6">
          <div className="flex items-center gap-2 mb-4">
            <Info size={18} className="text-primary" />
            <h3 className="font-semibold text-foreground">Audience Intelligence</h3>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Why This Audience Matters</h4>
              <p className="text-sm text-foreground/80">{insights.why}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Affluence Index</div>
                <div className="text-sm font-bold text-foreground">{insights.affluenceIndex}</div>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">OTT Engagement</div>
                <div className="text-sm font-bold text-foreground">{insights.ottEngagement}</div>
              </div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Conversion Potential</div>
              <div className="text-lg font-bold text-primary">{insights.conversionPotential}</div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Selected Attributes</h4>
              <div className="flex flex-wrap gap-1.5">
                {insights.attributes.map((s, i) => <span key={i} className="pill-chip text-xs">{s}</span>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Matching Data Partners</h4>
              <div className="flex flex-wrap gap-1.5">
                {insights.matchingPartners.map((p, i) => <span key={i} className="px-2 py-1 bg-secondary/50 text-xs text-foreground rounded">{p}</span>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Available Activation Platforms</h4>
              <div className="flex flex-wrap gap-1.5">
                {insights.platforms.map((p, i) => <span key={i} className="px-2 py-1 bg-secondary/50 text-xs text-foreground rounded">{p}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAudience;
