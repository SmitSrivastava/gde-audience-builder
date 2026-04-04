
import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, Play, Database, Users, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { allAudiences } from '@/data/audiences';
import { useSavedAudiences } from '@/contexts/SavedAudiencesContext';

interface FieldMapping { audienceField: string; clientField: string; matchType: 'exact'; }

const EnrichAudience = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const { savedAudiences } = useSavedAudiences();

  const matchedAudience = useMemo(() => {
    return allAudiences.find(a => a.id === id) || savedAudiences.find(a => a.id === id);
  }, [id, savedAudiences]);

  const audienceName = matchedAudience?.name || 'Selected Audience';
  const audienceSize = matchedAudience?.size || '~15M';
  const audienceSizeNum = matchedAudience?.sizeNum || 15000000;
  const audienceAttributes = matchedAudience?.attributes || [];

  const [sqlCollapsed, setSqlCollapsed] = useState(true);
  const [selectedClientDatasets, setSelectedClientDatasets] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([
    { audienceField: 'device_id', clientField: 'device_id', matchType: 'exact' }
  ]);
  const [enrichmentResults, setEnrichmentResults] = useState<any>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [saved, setSaved] = useState(false);

  const clientDatasets = [
    { id: '1', name: 'Netflix Subscriber Data', recordCount: 28000000 },
    { id: '2', name: 'App Engagement Data', recordCount: 62000000 },
  ];

  const fieldOptions = ['device_id', 'hashed_phone', 'hashed_email'];

  const handleClientDatasetToggle = (datasetId: string) => {
    setSelectedClientDatasets(prev => prev.includes(datasetId) ? prev.filter(i => i !== datasetId) : [...prev, datasetId]);
  };
  const updateFieldMapping = (index: number, updates: Partial<FieldMapping>) => {
    setFieldMappings(fieldMappings.map((m, i) => i === index ? { ...m, ...updates } : m));
  };

  const [storedOverlap] = useState(parseFloat((55 + Math.random() * 5).toFixed(1)));

  const handleRunEnrichment = async () => {
    if (selectedClientDatasets.length === 0) { toast({ title: "Error", description: "Please select at least one client dataset to enrich", variant: "destructive" }); return; }
    setIsEnriching(true);
    setSaved(false);
    setTimeout(() => {
      setEnrichmentResults({
        totalAudienceRecords: audienceSizeNum,
        netflixRecords: 28000000,
        matchRate: storedOverlap,
        newFieldsAdded: audienceAttributes.length || 6,
      });
      setIsEnriching(false);
    }, 2000);
  };

  const handleSaveEnrichedData = () => {
    if (!enrichmentResults) return;
    const enrichedCount = Math.round(enrichmentResults.totalAudienceRecords * (enrichmentResults.matchRate / 100));
    const enrichedInM = (enrichedCount / 1000000).toFixed(1);
    setSaved(true);
    toast({ title: "Success", description: `Successfully enriched ${enrichedInM}M records` });
  };

  return (
    <div className="space-y-8">
      <div className="hero-gradient rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[hsl(0_85%_50%/0.08)] rounded-full blur-[80px]"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-foreground mb-2">Netflix Cohort Enrichment</h1>
          <p className="text-lg text-muted-foreground">Enrich Netflix cohort with insights from the selected audience segment</p>
        </div>
      </div>

      {/* Audience Context */}
      <div className="bg-card rounded-xl p-6 neon-border">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 bg-primary/15 border border-primary/30 rounded-lg flex items-center justify-center">
            <Users className="text-primary" size={20} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">Source Audience: {audienceName}</h2>
            <p className="text-sm text-muted-foreground">{audienceSize} records • Attributes: {audienceAttributes.join(', ')}</p>
          </div>
          <button onClick={() => setSqlCollapsed(!sqlCollapsed)} className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:bg-secondary rounded-lg transition-all">
            {sqlCollapsed ? 'Show Query' : 'Hide Query'} {sqlCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
        {!sqlCollapsed && (
          <div className="bg-background rounded-lg p-4 border border-border">
            <pre className="text-sm text-primary font-mono overflow-x-auto">SELECT user_id, demographic_segment, ott_profile{'\n'}FROM audience_data{'\n'}WHERE audience_segment = '{audienceName}'</pre>
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
            <label key={dataset.id} className="group flex items-center gap-4 p-5 rounded-xl border border-border hover:border-primary/30 cursor-pointer transition-all hover:bg-secondary/30">
              <input type="checkbox" checked={selectedClientDatasets.includes(dataset.id)} onChange={() => handleClientDatasetToggle(dataset.id)} className="w-5 h-5 accent-[hsl(0,85%,50%)]" />
              <div className="flex items-center gap-3 flex-1">
                <h4 className="font-semibold text-foreground">{dataset.name}</h4>
                <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full font-medium border border-primary/20">{(dataset.recordCount / 1000000).toFixed(0)}M records</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Field Mapping */}
      {selectedClientDatasets.length > 0 && (
        <div className="bg-card rounded-xl p-6 neon-border">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-primary/15 border border-primary/30 rounded-lg flex items-center justify-center">
              <Zap className="text-primary" size={20} />
            </div>
            <h3 className="text-xl font-bold text-foreground">Configure Field Mapping</h3>
          </div>
          <div className="space-y-4">
            {fieldMappings.map((mapping, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg">
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Audience Field</label>
                    <select value={mapping.audienceField} onChange={(e) => updateFieldMapping(index, { audienceField: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
                      {fieldOptions.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Client Field</label>
                    <select value={mapping.clientField} onChange={(e) => updateFieldMapping(index, { clientField: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
                      {fieldOptions.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Match Type</label>
                    <select value={mapping.matchType} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" disabled>
                      <option value="exact">Exact Match</option>
                    </select>
                  </div>
                </div>
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
                { label: 'Audience Records', value: `${(enrichmentResults.totalAudienceRecords / 1000000).toFixed(1)}M` },
                { label: 'Netflix Records', value: `${(enrichmentResults.netflixRecords / 1000000).toFixed(1)}M` },
                { label: 'Overlap / Match Rate', value: `${enrichmentResults.matchRate}%` },
                { label: 'Data Points Enriched', value: enrichmentResults.newFieldsAdded },
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

      {enrichmentResults && (
        <div className="bg-card rounded-xl p-6 neon-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-foreground">Save Enriched Netflix Cohort Data</h3>
              <p className="text-sm text-muted-foreground mt-1">Create an enriched version of Netflix cohort with audience insights</p>
            </div>
            <button onClick={handleSaveEnrichedData} disabled={saved} className={`px-6 py-3 rounded-lg font-medium transition-colors ${saved ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}>
              {saved ? 'Saved ✓' : 'Save Enriched Data'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrichAudience;
