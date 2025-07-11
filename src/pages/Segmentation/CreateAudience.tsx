import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Code, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Partner {
  id: string;
  name: string;
  datasets: Dataset[];
}

interface Dataset {
  id: string;
  name: string;
  description: string;
  selected: boolean;
}

interface QueryRule {
  id: string;
  field: string;
  operator: string;
  value: string;
  logic: 'AND' | 'OR';
}

const CreateAudience = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [partners, setPartners] = useState<Partner[]>([
    {
      id: '1',
      name: 'Retail Analytics Co',
      datasets: [
        { id: '1-1', name: 'Customer Demographics', description: 'Age, gender, location', selected: false },
        { id: '1-2', name: 'Purchase History', description: 'Transaction records', selected: false }
      ]
    },
    {
      id: '2',
      name: 'Digital Marketing Corp',
      datasets: [
        { id: '2-1', name: 'Web Analytics', description: 'Site interactions', selected: false },
        { id: '2-2', name: 'Email Engagement', description: 'Email campaign data', selected: false }
      ]
    }
  ]);

  const [queryRules, setQueryRules] = useState<QueryRule[]>([
    { id: '1', field: 'age', operator: '>', value: '25', logic: 'AND' }
  ]);

  const [sqlQuery, setSqlQuery] = useState(`SELECT *
FROM customer_data
WHERE age > 25
  AND city = 'New York'`);

  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewStats, setPreviewStats] = useState({ count: 0, runtime: 0 });
  const [audienceName, setAudienceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const operators = ['=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN', 'LIKE'];
  const fields = ['age', 'gender', 'city', 'purchase_amount', 'last_visit_date', 'email_domain'];

  const handlePartnerToggle = (partnerId: string) => {
    setSelectedPartners(prev => 
      prev.includes(partnerId)
        ? prev.filter(id => id !== partnerId)
        : [...prev, partnerId]
    );
  };

  const handleDatasetToggle = (partnerId: string, datasetId: string) => {
    setPartners(prev => prev.map(partner => 
      partner.id === partnerId 
        ? {
            ...partner,
            datasets: partner.datasets.map(dataset =>
              dataset.id === datasetId 
                ? { ...dataset, selected: !dataset.selected }
                : dataset
            )
          }
        : partner
    ));
  };

  const addQueryRule = () => {
    const newRule: QueryRule = {
      id: Date.now().toString(),
      field: 'age',
      operator: '=',
      value: '',
      logic: 'AND'
    };
    setQueryRules([...queryRules, newRule]);
  };

  const removeQueryRule = (id: string) => {
    setQueryRules(queryRules.filter(rule => rule.id !== id));
  };

  const updateQueryRule = (id: string, updates: Partial<QueryRule>) => {
    setQueryRules(queryRules.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    ));
  };

  const handlePreview = async () => {
    try {
      console.log('Running preview with SQL:', sqlQuery);
      // Simulate API call
      const mockData = [
        { id: 1, name: 'John Doe', age: 32, city: 'New York', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', age: 28, city: 'New York', email: 'jane@example.com' },
        { id: 3, name: 'Bob Johnson', age: 35, city: 'New York', email: 'bob@example.com' }
      ];
      
      setPreviewData(mockData);
      setPreviewStats({ count: 15420, runtime: 2.3 });
      
      toast({
        title: "Preview Complete",
        description: `Found ${mockData.length} sample records from ${15420} total`,
      });
    } catch (error) {
      console.error('Preview failed:', error);
      toast({
        title: "Error",
        description: "Preview failed. Please check your SQL query.",
        variant: "destructive",
      });
    }
  };

  const handleCreateAudience = async () => {
    if (!audienceName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an audience name",
        variant: "destructive",
      });
      return;
    }

    if (!sqlQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a SQL query",
        variant: "destructive",
      });
      return;
    }

    if (selectedPartners.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one data partner",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const audienceData = {
        name: audienceName,
        sql: sqlQuery,
        partners: selectedPartners,
        datasets: partners
          .filter(partner => selectedPartners.includes(partner.id))
          .flatMap(partner => 
            partner.datasets
              .filter(dataset => dataset.selected)
              .map(dataset => ({ partnerId: partner.id, datasetId: dataset.id }))
          )
      };
      
      console.log('Creating audience:', audienceData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Success",
        description: `Audience "${audienceName}" created successfully`,
      });
      
      // Navigate back to audience list
      navigate('/segmentation');
    } catch (error) {
      console.error('Failed to create audience:', error);
      toast({
        title: "Error",
        description: "Failed to create audience. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Create Audience
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Build custom audience segments using available datasets
        </p>
      </div>

      {/* Client Banner */}
      <div className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-semibold mb-2">Global Retail Brand</h2>
        <p className="opacity-90">Creating audience segment for campaign optimization</p>
      </div>

      {/* Partner Selection */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Select Data Partners
        </h3>
        <div className="flex flex-wrap gap-3">
          {partners.map(partner => (
            <button
              key={partner.id}
              onClick={() => handlePartnerToggle(partner.id)}
              className={`px-4 py-2 rounded-2xl border-2 transition-all ${
                selectedPartners.includes(partner.id)
                  ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-400 text-teal-600 dark:text-teal-400'
                  : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-teal-300'
              }`}
            >
              {partner.name}
            </button>
          ))}
        </div>

        {/* Dataset Selection */}
        {selectedPartners.length > 0 && (
          <div className="mt-6 space-y-4">
            {partners
              .filter(partner => selectedPartners.includes(partner.id))
              .map(partner => (
                <div key={partner.id} className="border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                  <h4 className="font-medium text-slate-900 dark:text-white mb-3">
                    {partner.name} Datasets
                  </h4>
                  <div className="space-y-2">
                    {partner.datasets.map(dataset => (
                      <label key={dataset.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dataset.selected}
                          onChange={() => handleDatasetToggle(partner.id, dataset.id)}
                          className="w-4 h-4 text-teal-500 border-slate-300 rounded focus:ring-teal-400"
                        />
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {dataset.name}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {dataset.description}
                          </div>
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Visual Query Builder
            </h3>
            <button
              onClick={addQueryRule}
              className="flex items-center gap-2 px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              Add Rule
            </button>
          </div>
          
          <div className="space-y-3">
            {queryRules.map((rule, index) => (
              <div key={rule.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                {index > 0 && (
                  <select
                    value={rule.logic}
                    onChange={(e) => updateQueryRule(rule.id, { logic: e.target.value as 'AND' | 'OR' })}
                    className="px-2 py-1 text-xs bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded"
                  >
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                  </select>
                )}
                
                <select
                  value={rule.field}
                  onChange={(e) => updateQueryRule(rule.id, { field: e.target.value })}
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-lg text-sm"
                >
                  {fields.map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
                
                <select
                  value={rule.operator}
                  onChange={(e) => updateQueryRule(rule.id, { operator: e.target.value })}
                  className="px-3 py-2 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-lg text-sm"
                >
                  {operators.map(op => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
                
                <input
                  type="text"
                  value={rule.value}
                  onChange={(e) => updateQueryRule(rule.id, { value: e.target.value })}
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-lg text-sm"
                  placeholder="Value"
                />
                
                <button
                  onClick={() => removeQueryRule(rule.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Code size={20} />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              SQL Editor
            </h3>
          </div>
          <textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            className="w-full h-48 px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-mono resize-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            placeholder="Enter your SQL query here..."
          />
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Preview Results
          </h3>
          <button
            onClick={handlePreview}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
          >
            <Play size={16} />
            Run Preview
          </button>
        </div>

        {previewData.length > 0 && (
          <>
            <div className="flex gap-6 mb-4 text-sm">
              <span className="text-slate-600 dark:text-slate-300">
                Total Records: <strong className="text-slate-900 dark:text-white">{previewStats.count.toLocaleString()}</strong>
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                Runtime: <strong className="text-slate-900 dark:text-white">{previewStats.runtime}s</strong>
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-600">
                    <th className="text-left py-2 font-medium text-slate-700 dark:text-slate-300">ID</th>
                    <th className="text-left py-2 font-medium text-slate-700 dark:text-slate-300">Name</th>
                    <th className="text-left py-2 font-medium text-slate-700 dark:text-slate-300">Age</th>
                    <th className="text-left py-2 font-medium text-slate-700 dark:text-slate-300">City</th>
                    <th className="text-left py-2 font-medium text-slate-700 dark:text-slate-300">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr key={index} className="border-b border-slate-100 dark:border-slate-700">
                      <td className="py-2 text-slate-900 dark:text-white">{row.id}</td>
                      <td className="py-2 text-slate-900 dark:text-white">{row.name}</td>
                      <td className="py-2 text-slate-900 dark:text-white">{row.age}</td>
                      <td className="py-2 text-slate-900 dark:text-white">{row.city}</td>
                      <td className="py-2 text-slate-900 dark:text-white">{row.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Create Audience */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={audienceName}
            onChange={(e) => setAudienceName(e.target.value)}
            placeholder="Enter audience name..."
            className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent"
          />
          <button
            onClick={handleCreateAudience}
            disabled={isCreating || !audienceName.trim() || !sqlQuery.trim()}
            className={`px-6 py-3 rounded-2xl font-medium transition-colors ${
              isCreating || !audienceName.trim() || !sqlQuery.trim()
                ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                : 'bg-teal-500 hover:bg-teal-600 text-white'
            }`}
          >
            {isCreating ? 'Creating...' : 'Create Audience'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAudience;
