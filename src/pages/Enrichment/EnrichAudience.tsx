
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, Plus, Play, Database, Users, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClientDataset {
  id: string;
  name: string;
  description: string;
  fields: string[];
  recordCount: number;
}

interface FieldMapping {
  audienceField: string;
  clientField: string;
  matchType: 'exact' | 'fuzzy' | 'email_hash';
}

const EnrichAudience = () => {
  const { id } = useParams();
  const { toast } = useToast();
  
  const [audience] = useState({
    id: id,
    name: 'High-Value Shoppers',
    rowCount: 15420,
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

  // Client datasets available for enrichment
  const clientDatasets: ClientDataset[] = [
    {
      id: '1',
      name: 'Customer Master Data',
      description: 'Core customer information including demographics and contact details',
      fields: ['email_address', 'customer_id', 'first_name', 'last_name', 'phone', 'address'],
      recordCount: 50000
    },
    {
      id: '2',
      name: 'Transaction History',
      description: 'Historical purchase and transaction data',
      fields: ['email_address', 'transaction_id', 'purchase_date', 'amount', 'product_category'],
      recordCount: 150000
    },
    {
      id: '3',
      name: 'Digital Interactions',
      description: 'Website and app engagement data',
      fields: ['email_address', 'session_id', 'page_views', 'time_spent', 'conversion_events'],
      recordCount: 200000
    }
  ];

  const audienceFields = ['email', 'customer_id', 'phone', 'user_id', 'device_id'];
  const clientFields = ['email_address', 'customer_id', 'phone', 'first_name', 'last_name', 'transaction_id'];

  const handleClientDatasetToggle = (datasetId: string) => {
    setSelectedClientDatasets(prev => 
      prev.includes(datasetId)
        ? prev.filter(id => id !== datasetId)
        : [...prev, datasetId]
    );
  };

  const addFieldMapping = () => {
    setFieldMappings([...fieldMappings, { audienceField: 'email', clientField: 'email_address', matchType: 'exact' }]);
  };

  const updateFieldMapping = (index: number, updates: Partial<FieldMapping>) => {
    setFieldMappings(fieldMappings.map((mapping, i) => 
      i === index ? { ...mapping, ...updates } : mapping
    ));
  };

  const removeFieldMapping = (index: number) => {
    setFieldMappings(fieldMappings.filter((_, i) => i !== index));
  };

  const handleRunEnrichment = async () => {
    if (selectedClientDatasets.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one client dataset to enrich",
        variant: "destructive",
      });
      return;
    }

    setIsEnriching(true);
    try {
      console.log('Running enrichment with:', { 
        audienceId: id, 
        clientDatasets: selectedClientDatasets, 
        mappings: fieldMappings 
      });
      
      // Mock enrichment result
      setTimeout(() => {
        const enrichedRecords = Math.floor(audience.rowCount * 0.85); // 85% match rate
        const newFields = 5;
        setEnrichmentResults({
          totalAudienceRecords: audience.rowCount,
          matchedRecords: enrichedRecords,
          matchRate: ((enrichedRecords / audience.rowCount) * 100).toFixed(1),
          newFieldsAdded: newFields,
          enrichedDatasets: selectedClientDatasets.length
        });
        setIsEnriching(false);
        toast({
          title: "Enrichment Complete",
          description: `Successfully enriched ${enrichedRecords.toLocaleString()} client records with audience insights`,
        });
      }, 2000);
    } catch (error) {
      console.error('Enrichment failed:', error);
      setIsEnriching(false);
      toast({
        title: "Error",
        description: "Enrichment failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveEnrichedData = async () => {
    try {
      console.log('Saving enriched client data:', enrichmentResults);
      toast({
        title: "Success",
        description: "Enriched client dataset saved successfully",
      });
    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: "Error",
        description: "Failed to save enriched data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl"></div>
        <div className="relative p-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Client Data Enrichment
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg">
            Enrich your client datasets with insights from the selected audience cohort
          </p>
        </div>
      </div>

      {/* Audience Context */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
            <Users className="text-white" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Source Audience: {audience.name}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mt-1">
              {audience.rowCount.toLocaleString()} records from partner datasets: {audience.partnerDatasets.join(', ')}
            </p>
          </div>
          <button
            onClick={() => setSqlCollapsed(!sqlCollapsed)}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all duration-200"
          >
            {sqlCollapsed ? 'Show Query' : 'Hide Query'}
            {sqlCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
        
        {!sqlCollapsed && (
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700">
            <pre className="text-sm text-green-400 font-mono overflow-x-auto">
              {audience.sql}
            </pre>
          </div>
        )}
      </div>

      {/* Client Dataset Selection */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
            <Database className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Select Client Datasets to Enrich
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mt-1">
              Choose which client datasets will be enriched with audience insights
            </p>
          </div>
        </div>
        
        <div className="grid gap-4">
          {clientDatasets.map(dataset => (
            <label key={dataset.id} className="group flex items-start gap-4 p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer transition-all duration-200 hover:shadow-lg">
              <input
                type="checkbox"
                checked={selectedClientDatasets.includes(dataset.id)}
                onChange={() => handleClientDatasetToggle(dataset.id)}
                className="w-5 h-5 mt-1 text-blue-500 border-slate-300 rounded focus:ring-blue-400 focus:ring-2"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-lg">
                    {dataset.name}
                  </h4>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full font-medium">
                    {dataset.recordCount.toLocaleString()} records
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-3">
                  {dataset.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {dataset.fields.map(field => (
                    <span key={field} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg font-mono">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Field Mapping */}
      {selectedClientDatasets.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                <Zap className="text-white" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                Configure Field Mapping
              </h3>
            </div>
            <button
              onClick={addFieldMapping}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus size={16} />
              Add Mapping
            </button>
          </div>
          
          <div className="space-y-4">
            {fieldMappings.map((mapping, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-2xl">
                <div className="flex-1 grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Audience Field
                    </label>
                    <select
                      value={mapping.audienceField}
                      onChange={(e) => updateFieldMapping(index, { audienceField: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-500 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    >
                      {audienceFields.map(field => (
                        <option key={field} value={field}>{field}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">→</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Client Field
                    </label>
                    <select
                      value={mapping.clientField}
                      onChange={(e) => updateFieldMapping(index, { clientField: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-500 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    >
                      {clientFields.map(field => (
                        <option key={field} value={field}>{field}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Match Type
                    </label>
                    <select
                      value={mapping.matchType}
                      onChange={(e) => updateFieldMapping(index, { matchType: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-500 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    >
                      <option value="exact">Exact Match</option>
                      <option value="fuzzy">Fuzzy Match</option>
                      <option value="email_hash">Email Hash</option>
                    </select>
                  </div>
                </div>
                
                <button
                  onClick={() => removeFieldMapping(index)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Run Enrichment */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            Execute Enrichment Process
          </h3>
          <button
            onClick={handleRunEnrichment}
            disabled={isEnriching || selectedClientDatasets.length === 0}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-semibold transition-all duration-200 ${
              isEnriching || selectedClientDatasets.length === 0
                ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            <Play size={20} />
            {isEnriching ? 'Processing Enrichment...' : 'Start Enrichment'}
          </button>
        </div>
        
        {enrichmentResults && (
          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200 dark:border-blue-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {enrichmentResults.totalAudienceRecords.toLocaleString()}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Audience Records
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {enrichmentResults.matchedRecords.toLocaleString()}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Client Records Enriched
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {enrichmentResults.matchRate}%
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Match Rate
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {enrichmentResults.newFieldsAdded}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  New Data Points
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Enriched Data */}
      {enrichmentResults && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                Save Enriched Client Data
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mt-2">
                Create an enriched version of your client datasets with audience insights
              </p>
            </div>
            <button
              onClick={handleSaveEnrichedData}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Save Enriched Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrichAudience;
