
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, Plus, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnrichmentDataset {
  id: string;
  name: string;
  description: string;
  fields: string[];
}

interface FieldMapping {
  audienceField: string;
  enrichmentField: string;
  filter?: string;
}

const EnrichAudience = () => {
  const { id } = useParams();
  const { toast } = useToast();
  
  const [audience] = useState({
    id: id,
    name: 'High-Value Shoppers',
    rowCount: 15420,
    sql: 'SELECT * FROM customer_data WHERE age > 25 AND city = \'New York\''
  });

  const [sqlCollapsed, setSqlCollapsed] = useState(true);
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([
    { audienceField: 'email', enrichmentField: 'email_address' }
  ]);
  const [enrichedRowCount, setEnrichedRowCount] = useState<number | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);

  const enrichmentDatasets: EnrichmentDataset[] = [
    {
      id: '1',
      name: 'Customer Purchase History',
      description: 'Historical transaction data',
      fields: ['email_address', 'purchase_amount', 'purchase_date', 'product_category']
    },
    {
      id: '2',
      name: 'Engagement Metrics',
      description: 'Email and web engagement data',
      fields: ['email_address', 'open_rate', 'click_rate', 'last_engagement']
    },
    {
      id: '3',
      name: 'Demographics',
      description: 'Additional demographic information',
      fields: ['email_address', 'income_bracket', 'education_level', 'household_size']
    }
  ];

  const audienceFields = ['email', 'customer_id', 'phone', 'user_id'];
  const enrichmentFields = ['email_address', 'purchase_amount', 'purchase_date', 'product_category', 'open_rate', 'click_rate', 'income_bracket'];

  const handleDatasetToggle = (datasetId: string) => {
    setSelectedDatasets(prev => 
      prev.includes(datasetId)
        ? prev.filter(id => id !== datasetId)
        : [...prev, datasetId]
    );
  };

  const addFieldMapping = () => {
    setFieldMappings([...fieldMappings, { audienceField: 'email', enrichmentField: 'email_address' }]);
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
    if (selectedDatasets.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one enrichment dataset",
        variant: "destructive",
      });
      return;
    }

    setIsEnriching(true);
    try {
      // Simulate API call
      console.log('Running enrichment with:', { 
        audienceId: id, 
        datasets: selectedDatasets, 
        mappings: fieldMappings 
      });
      
      // Mock enrichment result
      setTimeout(() => {
        const newCount = audience.rowCount + Math.floor(Math.random() * 1000);
        setEnrichedRowCount(newCount);
        setIsEnriching(false);
        toast({
          title: "Enrichment Complete",
          description: `Added ${newCount - audience.rowCount} enriched records`,
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

  const handleSaveEnrichedAudience = async () => {
    try {
      console.log('Saving enriched audience:', { audienceId: id, enrichedRowCount });
      // API call would go here
      toast({
        title: "Success",
        description: "Enriched audience saved successfully",
      });
    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: "Error",
        description: "Failed to save enriched audience",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Enrich Audience
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Enhance your audience with additional first-party data
        </p>
      </div>

      {/* Audience Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {audience.name}
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              {audience.rowCount.toLocaleString()} records
            </p>
          </div>
          <button
            onClick={() => setSqlCollapsed(!sqlCollapsed)}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            {sqlCollapsed ? 'Show SQL' : 'Hide SQL'}
            {sqlCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
        
        {!sqlCollapsed && (
          <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
            <pre className="text-sm text-slate-700 dark:text-slate-300 font-mono overflow-x-auto">
              {audience.sql}
            </pre>
          </div>
        )}
      </div>

      {/* Dataset Selection */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Select Enrichment Datasets
        </h3>
        <div className="space-y-3">
          {enrichmentDatasets.map(dataset => (
            <label key={dataset.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedDatasets.includes(dataset.id)}
                onChange={() => handleDatasetToggle(dataset.id)}
                className="w-4 h-4 text-teal-500 border-slate-300 rounded focus:ring-teal-400"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 dark:text-white">
                  {dataset.name}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {dataset.description}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Fields: {dataset.fields.join(', ')}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Field Mapping */}
      {selectedDatasets.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Field Mapping
            </h3>
            <button
              onClick={addFieldMapping}
              className="flex items-center gap-2 px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              Add Mapping
            </button>
          </div>
          
          <div className="space-y-3">
            {fieldMappings.map((mapping, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <select
                  value={mapping.audienceField}
                  onChange={(e) => updateFieldMapping(index, { audienceField: e.target.value })}
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-lg text-sm"
                >
                  {audienceFields.map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
                
                <span className="text-slate-500 dark:text-slate-400">→</span>
                
                <select
                  value={mapping.enrichmentField}
                  onChange={(e) => updateFieldMapping(index, { enrichmentField: e.target.value })}
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-lg text-sm"
                >
                  {enrichmentFields.map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
                
                <input
                  type="text"
                  value={mapping.filter || ''}
                  onChange={(e) => updateFieldMapping(index, { filter: e.target.value })}
                  placeholder="Optional filter"
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-lg text-sm"
                />
                
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
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Run Enrichment
          </h3>
          <button
            onClick={handleRunEnrichment}
            disabled={isEnriching || selectedDatasets.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              isEnriching || selectedDatasets.length === 0
                ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <Play size={16} />
            {isEnriching ? 'Enriching...' : 'Run Enrichment'}
          </button>
        </div>
        
        {enrichedRowCount && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <div className="text-green-800 dark:text-green-200 font-medium">
              Enrichment Complete
            </div>
            <div className="text-green-600 dark:text-green-300 text-sm">
              Original: {audience.rowCount.toLocaleString()} records
            </div>
            <div className="text-green-600 dark:text-green-300 text-sm">
              Enriched: {enrichedRowCount.toLocaleString()} records
            </div>
            <div className="text-green-600 dark:text-green-300 text-sm">
              Added: {(enrichedRowCount - audience.rowCount).toLocaleString()} records
            </div>
          </div>
        )}
      </div>

      {/* Save Enriched Audience */}
      {enrichedRowCount && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Save Enriched Audience
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
                This will create a new version of your audience with the enriched data
              </p>
            </div>
            <button
              onClick={handleSaveEnrichedAudience}
              className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-medium transition-colors"
            >
              Save Enriched Audience
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrichAudience;
