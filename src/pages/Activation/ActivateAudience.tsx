
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ActivationPlatform {
  id: string;
  name: string;
  logo: string;
  description: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'select';
    options?: string[];
    required: boolean;
  }>;
}

interface ActivationJob {
  id: string;
  platform: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  createdAt: string;
  config: Record<string, string>;
  error?: string;
}

const ActivateAudience = () => {
  const { id } = useParams();
  const { toast } = useToast();
  
  const [audience] = useState({
    id: id,
    name: 'High-Value Shoppers',
    rowCount: 15420,
    identityFields: {
      email: 14200,
      phone: 8900,
      customerId: 15420
    }
  });

  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [platformConfig, setPlatformConfig] = useState<Record<string, string>>({});
  const [activationJobs, setActivationJobs] = useState<ActivationJob[]>([]);
  const [isActivating, setIsActivating] = useState(false);

  const platforms: ActivationPlatform[] = [
    {
      id: 'google-ads',
      name: 'Google Ads',
      logo: '🎯',
      description: 'Activate to Google Ads Customer Match',
      fields: [
        { name: 'matchType', label: 'Match Type', type: 'select', options: ['Customer Match', 'Performance Max'], required: true },
        { name: 'accountId', label: 'Google Account ID', type: 'text', required: true }
      ]
    },
    {
      id: 'meta-ads',
      name: 'Meta Ads',
      logo: '📘',
      description: 'Activate to Meta/Facebook Ads',
      fields: [
        { name: 'integType', label: 'Integration Type', type: 'select', options: ['Pixel', 'CAPI'], required: true },
        { name: 'adAccountId', label: 'Ad Account ID', type: 'text', required: true }
      ]
    },
    {
      id: 'trade-desk',
      name: 'The Trade Desk',
      logo: '🏢',
      description: 'Activate to TTD platform',
      fields: [
        { name: 'advertiserId', label: 'Advertiser ID', type: 'text', required: true }
      ]
    },
    {
      id: 'amazon-dsp',
      name: 'Amazon DSP',
      logo: '📦',
      description: 'Activate to Amazon DSP',
      fields: [
        { name: 'advertiserId', label: 'Advertiser ID', type: 'text', required: true },
        { name: 'region', label: 'Region', type: 'select', options: ['US', 'EU', 'APAC'], required: true }
      ]
    }
  ];

  const handlePlatformSelect = (platformId: string) => {
    setSelectedPlatform(platformId);
    setPlatformConfig({});
  };

  const handleConfigChange = (field: string, value: string) => {
    setPlatformConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleActivate = async () => {
    if (!selectedPlatform) return;

    const platform = platforms.find(p => p.id === selectedPlatform);
    if (!platform) return;

    // Validate required fields
    const missingFields = platform.fields
      .filter(field => field.required && !platformConfig[field.name])
      .map(field => field.label);

    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    setIsActivating(true);
    try {
      const newJob: ActivationJob = {
        id: Date.now().toString(),
        platform: platform.name,
        status: 'queued',
        createdAt: new Date().toISOString(),
        config: platformConfig
      };

      setActivationJobs(prev => [newJob, ...prev]);
      
      // Simulate activation process
      console.log('Activating audience:', { 
        audienceId: id, 
        platform: selectedPlatform, 
        config: platformConfig 
      });

      // Simulate status progression
      setTimeout(() => {
        setActivationJobs(prev => prev.map(job => 
          job.id === newJob.id ? { ...job, status: 'processing' } : job
        ));
      }, 1000);

      setTimeout(() => {
        const success = Math.random() > 0.3; // 70% success rate
        setActivationJobs(prev => prev.map(job => 
          job.id === newJob.id 
            ? { 
                ...job, 
                status: success ? 'completed' : 'error',
                error: success ? undefined : 'Platform connection failed'
              } 
            : job
        ));
        
        toast({
          title: success ? "Activation Complete" : "Activation Failed",
          description: success 
            ? `Audience successfully activated to ${platform.name}` 
            : "Please check your configuration and try again",
          variant: success ? "default" : "destructive",
        });
      }, 4000);

      setSelectedPlatform(null);
      setPlatformConfig({});
    } catch (error) {
      console.error('Activation failed:', error);
      toast({
        title: "Error",
        description: "Activation failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsActivating(false);
    }
  };

  const getStatusIcon = (status: ActivationJob['status']) => {
    switch (status) {
      case 'queued':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: ActivationJob['status']) => {
    switch (status) {
      case 'queued':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'processing':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'error':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
    }
  };

  const selectedPlatformData = platforms.find(p => p.id === selectedPlatform);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Activate Audience
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Deploy your audience to advertising platforms
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
              {audience.rowCount.toLocaleString()} total records
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
            <div className="text-sm text-slate-600 dark:text-slate-300">Email Addresses</div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-white">
              {audience.identityFields.email.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
            <div className="text-sm text-slate-600 dark:text-slate-300">Phone Numbers</div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-white">
              {audience.identityFields.phone.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
            <div className="text-sm text-slate-600 dark:text-slate-300">Customer IDs</div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-white">
              {audience.identityFields.customerId.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Platform Selection */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Select Activation Platform
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map(platform => (
            <button
              key={platform.id}
              onClick={() => handlePlatformSelect(platform.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedPlatform === platform.id
                  ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20'
                  : 'border-slate-200 dark:border-slate-600 hover:border-teal-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{platform.logo}</span>
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {platform.name}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {platform.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Platform Configuration */}
      {selectedPlatform && selectedPlatformData && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Configure {selectedPlatformData.name}
          </h3>
          <div className="space-y-4">
            {selectedPlatformData.fields.map(field => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={platformConfig[field.name] || ''}
                    onChange={(e) => handleConfigChange(field.name, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={platformConfig[field.name] || ''}
                    onChange={(e) => handleConfigChange(field.name, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    placeholder={`Enter ${field.label}`}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={handleActivate}
              disabled={isActivating}
              className={`px-6 py-3 rounded-2xl font-medium transition-colors ${
                isActivating
                  ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  : 'bg-teal-500 hover:bg-teal-600 text-white'
              }`}
            >
              {isActivating ? 'Activating...' : 'Activate Audience'}
            </button>
          </div>
        </div>
      )}

      {/* Activation Status */}
      {activationJobs.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Activation History
          </h3>
          <div className="space-y-3">
            {activationJobs.map(job => (
              <div key={job.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <div className="flex items-center gap-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {job.platform}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {new Date(job.createdAt).toLocaleString()}
                    </div>
                    {job.error && (
                      <div className="text-sm text-red-500 mt-1">{job.error}</div>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivateAudience;
