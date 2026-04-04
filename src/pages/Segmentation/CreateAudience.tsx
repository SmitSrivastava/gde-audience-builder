
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Code, Plus, Trash2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Partner { id: string; name: string; datasets: Dataset[]; }
interface Dataset { id: string; name: string; description: string; selected: boolean; }
interface QueryRule { id: string; field: string; operator: string; value: string; logic: 'AND' | 'OR'; }

const CreateAudience = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [partners, setPartners] = useState<Partner[]>([
    { id: '1', name: 'Retail Analytics Co', datasets: [
      { id: '1-1', name: 'Customer Demographics', description: 'Age, gender, location', selected: false },
      { id: '1-2', name: 'Purchase History', description: 'Transaction records', selected: false }
    ]},
    { id: '2', name: 'Digital Marketing Corp', datasets: [
      { id: '2-1', name: 'Web Analytics', description: 'Site interactions', selected: false },
      { id: '2-2', name: 'Email Engagement', description: 'Email campaign data', selected: false }
    ]}
  ]);

  const [queryRules, setQueryRules] = useState<QueryRule[]>([
    { id: '1', field: 'age', operator: '>', value: '25', logic: 'AND' }
  ]);
  const [sqlQuery, setSqlQuery] = useState(`SELECT *\nFROM customer_data\nWHERE age > 25\n  AND city = 'New York'`);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewStats, setPreviewStats] = useState({ count: 0, runtime: 0 });
  const [audienceName, setAudienceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const operators = ['=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN', 'LIKE'];
  const fields = ['age', 'gender', 'city', 'purchase_amount', 'last_visit_date', 'email_domain'];

  const handlePartnerToggle = (partnerId: string) => {
    setSelectedPartners(prev => prev.includes(partnerId) ? prev.filter(id => id !== partnerId) : [...prev, partnerId]);
  };
  const handleDatasetToggle = (partnerId: string, datasetId: string) => {
    setPartners(prev => prev.map(p => p.id === partnerId ? { ...p, datasets: p.datasets.map(d => d.id === datasetId ? { ...d, selected: !d.selected } : d) } : p));
  };
  const addQueryRule = () => { setQueryRules([...queryRules, { id: Date.now().toString(), field: 'age', operator: '=', value: '', logic: 'AND' }]); };
  const removeQueryRule = (id: string) => { setQueryRules(queryRules.filter(r => r.id !== id)); };
  const updateQueryRule = (id: string, updates: Partial<QueryRule>) => { setQueryRules(queryRules.map(r => r.id === id ? { ...r, ...updates } : r)); };

  const handlePreview = async () => {
    const mockData = [
      { id: 1, name: 'John Doe', age: 32, city: 'New York', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', age: 28, city: 'New York', email: 'jane@example.com' },
      { id: 3, name: 'Bob Johnson', age: 35, city: 'New York', email: 'bob@example.com' }
    ];
    setPreviewData(mockData);
    setPreviewStats({ count: 15420, runtime: 2.3 });
    toast({ title: "Preview Complete", description: `Found ${mockData.length} sample records from 15,420 total` });
  };

  const handleCreateAudience = async () => {
    if (!audienceName.trim()) { toast({ title: "Error", description: "Please enter an audience name", variant: "destructive" }); return; }
    if (!sqlQuery.trim()) { toast({ title: "Error", description: "Please enter a SQL query", variant: "destructive" }); return; }
    if (selectedPartners.length === 0) { toast({ title: "Error", description: "Please select at least one data partner", variant: "destructive" }); return; }

    setIsCreating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({ title: "Success", description: `Audience "${audienceName}" created successfully` });
      navigate('/segmentation');
    } catch { toast({ title: "Error", description: "Failed to create audience.", variant: "destructive" }); }
    finally { setIsCreating(false); }
  };

  // Right panel data
  const audienceInsights = {
    why: 'This audience captures high-intent OTT users in metro India — ideal for Netflix subscriber acquisition campaigns targeting cord-cutters.',
    estimatedSize: '15,420',
    conversionLikelihood: 'High (72%)',
    signals: ['Purchase behavior', 'OTT subscription data', 'Content affinity', 'Device usage'],
    platforms: ['Google Ads', 'Meta Ads', 'The Trade Desk', 'DV360']
  };

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">Create Audience</h1>
            <span className="pill-chip text-xs">Pre-built Audience Template</span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/30">Acquisition</span>
          </div>
          <p className="text-muted-foreground">Build custom audience segments using available datasets</p>
        </div>

        {/* Client Banner */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-foreground mb-1">Global Retail Brand</h2>
          <p className="text-sm text-muted-foreground">Creating audience segment for campaign optimization</p>
        </div>

        {/* Partner Selection */}
        <div className="bg-card rounded-xl p-6 neon-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Select Data Partners</h3>
          <div className="flex flex-wrap gap-3">
            {partners.map(partner => (
              <button key={partner.id} onClick={() => handlePartnerToggle(partner.id)}
                className={`px-4 py-2 rounded-lg border transition-all ${selectedPartners.includes(partner.id) ? 'bg-primary/15 border-primary/50 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}
              >{partner.name}</button>
            ))}
          </div>

          {selectedPartners.length > 0 && (
            <div className="mt-6 space-y-4">
              {partners.filter(p => selectedPartners.includes(p.id)).map(partner => (
                <div key={partner.id} className="border border-border rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-3">{partner.name} Datasets</h4>
                  <div className="space-y-2">
                    {partner.datasets.map(dataset => (
                      <label key={dataset.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer">
                        <input type="checkbox" checked={dataset.selected} onChange={() => handleDatasetToggle(partner.id, dataset.id)} className="w-4 h-4 accent-[hsl(0,85%,50%)]" />
                        <div>
                          <div className="font-medium text-foreground">{dataset.name}</div>
                          <div className="text-sm text-muted-foreground">{dataset.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Query Builder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl p-6 neon-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Visual Query Builder</h3>
              <button onClick={addQueryRule} className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors">
                <Plus size={16} /> Add Rule
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
          </div>

          <div className="bg-card rounded-xl p-6 neon-border">
            <div className="flex items-center gap-2 mb-4">
              <Code size={20} className="text-primary" />
              <h3 className="text-lg font-semibold text-foreground">SQL Editor</h3>
            </div>
            <textarea value={sqlQuery} onChange={(e) => setSqlQuery(e.target.value)}
              className="w-full h-48 px-4 py-3 bg-background border border-border rounded-lg text-sm font-mono resize-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-foreground" placeholder="Enter SQL..." />
          </div>
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
                <span className="text-muted-foreground">Total: <strong className="text-foreground">{previewStats.count.toLocaleString()}</strong></span>
                <span className="text-muted-foreground">Runtime: <strong className="text-foreground">{previewStats.runtime}s</strong></span>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  {['ID','Name','Age','City','Email'].map(h => <th key={h} className="text-left py-2 font-medium text-muted-foreground">{h}</th>)}
                </tr></thead>
                <tbody>
                  {previewData.map((row, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="py-2 text-foreground">{row.id}</td><td className="py-2 text-foreground">{row.name}</td>
                      <td className="py-2 text-foreground">{row.age}</td><td className="py-2 text-foreground">{row.city}</td>
                      <td className="py-2 text-foreground">{row.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Create */}
        <div className="bg-card rounded-xl p-6 neon-border">
          <div className="flex items-center gap-4">
            <input type="text" value={audienceName} onChange={(e) => setAudienceName(e.target.value)} placeholder="Enter audience name..."
              className="flex-1 px-4 py-3 border border-border bg-background rounded-lg focus:ring-2 focus:ring-primary/50 text-foreground" />
            <button onClick={handleCreateAudience} disabled={isCreating || !audienceName.trim() || !sqlQuery.trim()}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${isCreating || !audienceName.trim() || !sqlQuery.trim() ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}
            >{isCreating ? 'Creating...' : 'Create Audience'}</button>
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
              <p className="text-sm text-foreground/80">{audienceInsights.why}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Est. Size</div>
                <div className="text-lg font-bold text-foreground">{audienceInsights.estimatedSize}</div>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Conversion</div>
                <div className="text-lg font-bold text-primary">{audienceInsights.conversionLikelihood}</div>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Data Signals</h4>
              <div className="flex flex-wrap gap-1.5">
                {audienceInsights.signals.map((s, i) => <span key={i} className="pill-chip text-xs">{s}</span>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Activation Platforms</h4>
              <div className="flex flex-wrap gap-1.5">
                {audienceInsights.platforms.map((p, i) => <span key={i} className="px-2 py-1 bg-secondary/50 text-xs text-foreground rounded">{p}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAudience;
