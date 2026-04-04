
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Code, Plus, Trash2, Info, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { allAudiences, audienceQueryConfigs, defaultQueryConfig } from '@/data/audiences';

interface QueryRule { id: string; field: string; operator: string; value: string; logic: 'AND' | 'OR'; }

const CreateAudience = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const audienceId = searchParams.get('audience');

  const matchedAudience = useMemo(() => allAudiences.find(a => a.id === audienceId), [audienceId]);
  const queryConfig = useMemo(() => (audienceId && audienceQueryConfigs[audienceId]) || defaultQueryConfig, [audienceId]);

  const [selectedPartners, setSelectedPartners] = useState<string[]>(queryConfig.dataPartners);
  const [queryRules, setQueryRules] = useState<QueryRule[]>(
    queryConfig.conditions.map((c, i) => ({ id: String(i + 1), field: c.field, operator: c.operator, value: c.value, logic: 'AND' as const }))
  );
  const [sqlQuery, setSqlQuery] = useState(queryConfig.sql);
  const [audienceName, setAudienceName] = useState(matchedAudience?.name || '');
  const [isCreating, setIsCreating] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewStats, setPreviewStats] = useState({ count: 0, runtime: 0 });
  const [dynamicSize, setDynamicSize] = useState(matchedAudience?.size || '~15M');

  // Additional filter states for demo
  const [ageRange, setAgeRange] = useState('24-45');
  const [professions, setProfessions] = useState<string[]>([]);

  const availableProfessions = ['Entrepreneurs', 'Consultants', 'Finance Professionals', 'MBA', 'Family Business'];

  useEffect(() => {
    if (matchedAudience) {
      setAudienceName(matchedAudience.name);
      setDynamicSize(matchedAudience.size);
    }
  }, [matchedAudience]);

  // Recalculate dynamic size when filters change
  useEffect(() => {
    if (matchedAudience) {
      const base = matchedAudience.sizeNum;
      const filterReduction = (professions.length > 0 ? 0.3 + professions.length * 0.05 : 0);
      const reduced = Math.round(base * (1 - filterReduction));
      const inMillions = (reduced / 1000000).toFixed(0);
      setDynamicSize(`~${inMillions}M`);
    }
  }, [professions, matchedAudience]);

  const allPartners = ['Telco Data Provider', 'OTT App Analytics', 'Device Intelligence Corp', 'Financial Proxy Signals', 'Content Affinity Engine', 'Engagement Depth Platform'];
  const operators = ['=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN', 'BETWEEN', 'LIKE'];
  const fields = ['income_level', 'city', 'ott_apps_installed', 'device_type', 'age', 'profession', 'content_genre', 'affluence_tier', 'geo', 'monthly_watch_hours', 'ott_subscriptions', 'city_tier', 'ott_active'];

  const handlePartnerToggle = (partner: string) => {
    setSelectedPartners(prev => prev.includes(partner) ? prev.filter(p => p !== partner) : [...prev, partner]);
  };

  const addQueryRule = () => { setQueryRules([...queryRules, { id: Date.now().toString(), field: 'age', operator: '=', value: '', logic: 'AND' }]); };
  const removeQueryRule = (id: string) => { setQueryRules(queryRules.filter(r => r.id !== id)); };
  const updateQueryRule = (id: string, updates: Partial<QueryRule>) => { setQueryRules(queryRules.map(r => r.id === id ? { ...r, ...updates } : r)); };

  const handlePreview = () => {
    const mockData = [
      { id: 1, user_segment: 'Premium Metro', ott_profile: 'Multi-OTT', device: 'iPhone 15 Pro', city: 'Mumbai' },
      { id: 2, user_segment: 'Affluent Professional', ott_profile: '3+ Subscriptions', device: 'Samsung S24', city: 'Delhi' },
      { id: 3, user_segment: 'Business Owner', ott_profile: 'Netflix + Hotstar', device: 'OnePlus 12', city: 'Bangalore' },
    ];
    setPreviewData(mockData);
    setPreviewStats({ count: matchedAudience?.sizeNum || 15000000, runtime: 1.8 });
    toast({ title: "Preview Complete", description: `Found sample records from ${dynamicSize} total audience` });
  };

  const handleCreateAudience = async () => {
    if (!audienceName.trim()) { toast({ title: "Error", description: "Please enter an audience name", variant: "destructive" }); return; }
    setIsCreating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({ title: "Audience Saved", description: `"${audienceName}" saved successfully with ${dynamicSize} estimated reach` });
      navigate('/segmentation');
    } catch { toast({ title: "Error", description: "Failed to save audience.", variant: "destructive" }); }
    finally { setIsCreating(false); }
  };

  const insights = queryConfig.insights;

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
            {allPartners.map(partner => (
              <button key={partner} onClick={() => handlePartnerToggle(partner)}
                className={`px-4 py-2 rounded-lg border transition-all text-sm ${selectedPartners.includes(partner) ? 'bg-primary/15 border-primary/50 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}
              >{partner}</button>
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
              <div key={rule.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                {index > 0 && (
                  <select value={rule.logic} onChange={(e) => updateQueryRule(rule.id, { logic: e.target.value as 'AND' | 'OR' })} className="px-2 py-1 text-xs bg-card border border-border rounded text-foreground">
                    <option value="AND">AND</option><option value="OR">OR</option>
                  </select>
                )}
                <select value={rule.field} onChange={(e) => updateQueryRule(rule.id, { field: e.target.value })} className="flex-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground">
                  {fields.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select value={rule.operator} onChange={(e) => updateQueryRule(rule.id, { operator: e.target.value })} className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground">
                  {operators.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
                <input type="text" value={rule.value} onChange={(e) => updateQueryRule(rule.id, { value: e.target.value })} className="flex-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground" placeholder="Value" />
                <button onClick={() => removeQueryRule(rule.id)} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>

          {/* Additional Filters */}
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground mb-3">Additional Filters</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Age Range</label>
                <input type="text" value={ageRange} onChange={(e) => setAgeRange(e.target.value)} className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Professions</label>
                <div className="flex flex-wrap gap-2">
                  {availableProfessions.map(p => (
                    <button key={p} onClick={() => setProfessions(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                      className={`px-2 py-1 rounded text-xs transition-all ${professions.includes(p) ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground border border-border'}`}
                    >{p}</button>
                  ))}
                </div>
              </div>
            </div>
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

        {/* Preview */}
        <div className="bg-card rounded-xl p-6 neon-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Preview Results</h3>
            <button onClick={handlePreview} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors">
              <Play size={16} /> Run Preview
            </button>
          </div>
          {previewData.length > 0 && (
            <>
              <div className="flex gap-6 mb-4 text-sm">
                <span className="text-muted-foreground">Total: <strong className="text-foreground">{(previewStats.count / 1000000).toFixed(1)}M</strong></span>
                <span className="text-muted-foreground">Runtime: <strong className="text-foreground">{previewStats.runtime}s</strong></span>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  {['ID', 'User Segment', 'OTT Profile', 'Device', 'City'].map(h => <th key={h} className="text-left py-2 font-medium text-muted-foreground">{h}</th>)}
                </tr></thead>
                <tbody>
                  {previewData.map((row, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="py-2 text-foreground">{row.id}</td>
                      <td className="py-2 text-foreground">{row.user_segment}</td>
                      <td className="py-2 text-foreground">{row.ott_profile}</td>
                      <td className="py-2 text-foreground">{row.device}</td>
                      <td className="py-2 text-foreground">{row.city}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
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
                <div className="text-xs text-muted-foreground">Audience Size</div>
                <div className="text-xl font-bold text-primary">{dynamicSize}</div>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Conversion</div>
                <div className="text-lg font-bold text-primary">{insights.conversionPotential}</div>
              </div>
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
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Data Signals</h4>
              <div className="flex flex-wrap gap-1.5">
                {insights.signals.map((s, i) => <span key={i} className="pill-chip text-xs">{s}</span>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Activation Platforms</h4>
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
