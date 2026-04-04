
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, Plus, Play, Database, Users, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClientDataset { id: string; name: string; description: string; fields: string[]; recordCount: number; }
interface FieldMapping { audienceField: string; clientField: string; matchType: 'exact' | 'fuzzy' | 'email_hash'; }

const EnrichAudience = () => {
  const { id } = useParams();
  const { toast } = useToast();
  
  const [audience] = useState({
    id, name: 'High-Value Shoppers', rowCount: 15420,
    sql: 'SELECT * FROM partner_data WHERE purchase_amount > 500 AND engagement_score > 0.8',
    partnerDatasets: ['Customer Purchase History', 'Engagement Metrics']
  });

  const [sqlCollapsed, setSqlCollapsed] = useState(true);
  const [selectedClientDatasets, setSelectedClientDatasets] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([
    { audienceField: 'email', clientField: 'email_address', matchType: 'exact' }
  ]);
  const [enrichmentResults, setEnrichmentResults] = useState<any>(null);
  const [isEnriching, setIsEnriching] = useState(false);

  const clientDatasets: ClientDataset[] = [
    { id: '1', name: 'Customer Master Data', description: 'Core customer information including demographics and contact details', fields: ['email_address', 'customer_id', 'first_name', 'last_name', 'phone', 'address'], recordCount: 50000 },
    { id: '2', name: 'Transaction History', description: 'Historical purchase and transaction data', fields: ['email_address', 'transaction_id', 'purchase_date', 'amount', 'product_category'], recordCount: 150000 },
    { id: '3', name: 'Digital Interactions', description: 'Website and app engagement data', fields: ['email_address', 'session_id', 'page_views', 'time_spent', 'conversion_events'], recordCount: 200000 }
  ];

  const audienceFields = ['email', 'customer_id', 'phone', 'user_id', 'device_id'];
  const clientFields = ['email_address', 'customer_id', 'phone', 'first_name', 'last_name', 'transaction_id'];

  const handleClientDatasetToggle = (datasetId: string) => {
    setSelectedClientDatasets(prev => prev.includes(datasetId) ? prev.filter(i => i !== datasetId) : [...prev, datasetId]);
  };
  const addFieldMapping = () => { setFieldMappings([...fieldMappings, { audienceField: 'email', clientField: 'email_address', matchType: 'exact' }]); };
  const updateFieldMapping = (index: number, updates: Partial<FieldMapping>) => { setFieldMappings(fieldMappings.map((m, i) => i === index ? { ...m, ...updates } : m)); };
  const removeFieldMapping = (index: number) => { setFieldMappings(fieldMappings.filter((_, i) => i !== index)); };

  const handleRunEnrichment = async () => {
    if (selectedClientDatasets.length === 0) { toast({ title: "Error", description: "Please select at least one client dataset to enrich", variant: "destructive" }); return; }
    setIsEnriching(true);
    setTimeout(() => {
      const enrichedRecords = Math.floor(audience.rowCount * 0.85);
      setEnrichmentResults({
        totalAudienceRecords: audience.rowCount, matchedRecords: enrichedRecords,
        matchRate: ((enrichedRecords / audience.rowCount) * 100).toFixed(1), newFieldsAdded: 5, enrichedDatasets: selectedClientDatasets.length
      });
      setIsEnriching(false);
      toast({ title: "Enrichment Complete", description: `Successfully enriched ${enrichedRecords.toLocaleString()} client records` });
    }, 2000);
  };

  const handleSaveEnrichedData = () => {
    toast({ title: "Success", description: "Enriched client dataset saved successfully" });
  };

  return (
    <div className="space-y-8">
      <div className="hero-gradient rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[hsl(0_85%_50%/0.08)] rounded-full blur-[80px]"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-foreground mb-2">Client Data Enrichment</h1>
          <p className="text-lg text-muted-foreground">Enrich your client datasets with insights from the selected audience cohort</p>
        </div>
      </div>

      {/* Audience Context */}
      <div className="bg-card rounded-xl p-6 neon-border">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 bg-primary/15 border border-primary/30 rounded-lg flex items-center justify-center">
            <Users className="text-primary" size={20} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">Source Audience: {audience.name}</h2>
            <p className="text-sm text-muted-foreground">{audience.rowCount.toLocaleString()} records from: {audience.partnerDatasets.join(', ')}</p>
          </div>
          <button onClick={() => setSqlCollapsed(!sqlCollapsed)} className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:bg-secondary rounded-lg transition-all">
            {sqlCollapsed ? 'Show Query' : 'Hide Query'} {sqlCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
        {!sqlCollapsed && (
          <div className="bg-background rounded-lg p-4 border border-border">
            <pre className="text-sm text-primary font-mono overflow-x-auto">{audience.sql}</pre>
          </div>
        )}
      </div>

      {/* Client Dataset Selection */}
      <div className="bg-card rounded-xl p-6 neon-border">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-primary/15 border border-primary/30 rounded-lg flex items-center justify-center">
            <Database className="text-primary" size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Select Client Datasets to Enrich</h3>
            <p className="text-sm text-muted-foreground">Choose which client datasets will be enriched with audience insights</p>
          </div>
        </div>
        <div className="grid gap-4">
          {clientDatasets.map(dataset => (
            <label key={dataset.id} className="group flex items-start gap-4 p-5 rounded-xl border border-border hover:border-primary/30 cursor-pointer transition-all hover:bg-secondary/30">
              <input type="checkbox" checked={selectedClientDatasets.includes(dataset.id)} onChange={() => handleClientDatasetToggle(dataset.id)} className="w-5 h-5 mt-1 accent-[hsl(0,85%,50%)]" />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-foreground">{dataset.name}</h4>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full font-medium border border-primary/20">{dataset.recordCount.toLocaleString()} records</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{dataset.description}</p>
                <div className="flex flex-wrap gap-2">
                  {dataset.fields.map(field => <span key={field} className="px-2 py-1 bg-secondary text-xs text-muted-foreground rounded font-mono">{field}</span>)}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Field Mapping */}
      {selectedClientDatasets.length > 0 && (
        <div className="bg-card rounded-xl p-6 neon-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/15 border border-primary/30 rounded-lg flex items-center justify-center">
                <Zap className="text-primary" size={20} />
              </div>
              <h3 className="text-xl font-bold text-foreground">Configure Field Mapping</h3>
            </div>
            <button onClick={addFieldMapping} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-all">
              <Plus size={16} /> Add Mapping
            </button>
          </div>
          <div className="space-y-4">
            {fieldMappings.map((mapping, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg">
                <div className="flex-1 grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Audience Field</label>
                    <select value={mapping.audienceField} onChange={(e) => updateFieldMapping(index, { audienceField: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
                      {audienceFields.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-8 h-8 bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center"><span className="text-primary text-sm">→</span></div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Client Field</label>
                    <select value={mapping.clientField} onChange={(e) => updateFieldMapping(index, { clientField: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
                      {clientFields.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Match Type</label>
                    <select value={mapping.matchType} onChange={(e) => updateFieldMapping(index, { matchType: e.target.value as any })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
                      <option value="exact">Exact Match</option><option value="fuzzy">Fuzzy Match</option><option value="email_hash">Email Hash</option>
                    </select>
                  </div>
                </div>
                <button onClick={() => removeFieldMapping(index)} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors">×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Run Enrichment */}
      <div className="bg-card rounded-xl p-6 neon-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-foreground">Execute Enrichment Process</h3>
          <button onClick={handleRunEnrichment} disabled={isEnriching || selectedClientDatasets.length === 0}
            className={`flex items-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all ${
              isEnriching || selectedClientDatasets.length === 0 ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}>
            <Play size={20} /> {isEnriching ? 'Processing...' : 'Start Enrichment'}
          </button>
        </div>
        {enrichmentResults && (
          <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Audience Records', value: enrichmentResults.totalAudienceRecords.toLocaleString() },
                { label: 'Client Records Enriched', value: enrichmentResults.matchedRecords.toLocaleString() },
                { label: 'Match Rate', value: `${enrichmentResults.matchRate}%` },
                { label: 'New Data Points', value: enrichmentResults.newFieldsAdded },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-bold text-primary">{item.value}</div>
                  <div className="text-sm text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      {enrichmentResults && (
        <div className="bg-card rounded-xl p-6 neon-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-foreground">Save Enriched Client Data</h3>
              <p className="text-sm text-muted-foreground mt-1">Create an enriched version of your client datasets with audience insights</p>
            </div>
            <button onClick={handleSaveEnrichedData} className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors">
              Save Enriched Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrichAudience;
