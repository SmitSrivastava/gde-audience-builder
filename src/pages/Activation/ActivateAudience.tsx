
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ActivationPlatform {
  id: string; name: string; logo: string; description: string;
  fields: Array<{ name: string; label: string; type: 'text' | 'select'; options?: string[]; required: boolean; }>;
}
interface ActivationJob { id: string; platform: string; status: 'queued' | 'processing' | 'completed' | 'error'; createdAt: string; config: Record<string, string>; error?: string; }

const ActivateAudience = () => {
  const { id } = useParams();
  const { toast } = useToast();
  
  const [audience] = useState({
    id, name: 'High-Value Shoppers', rowCount: 15420,
    identityFields: { email: 14200, phone: 8900, customerId: 15420 }
  });

  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [platformConfig, setPlatformConfig] = useState<Record<string, string>>({});
  const [activationJobs, setActivationJobs] = useState<ActivationJob[]>([]);
  const [isActivating, setIsActivating] = useState(false);

  const platforms: ActivationPlatform[] = [
    { id: 'google-ads', name: 'Google Ads', logo: '🎯', description: 'Activate to Google Ads Customer Match',
      fields: [{ name: 'matchType', label: 'Match Type', type: 'select', options: ['Customer Match', 'Performance Max'], required: true }, { name: 'accountId', label: 'Google Account ID', type: 'text', required: true }] },
    { id: 'meta-ads', name: 'Meta Ads', logo: '📘', description: 'Activate to Meta/Facebook Ads',
      fields: [{ name: 'integType', label: 'Integration Type', type: 'select', options: ['Pixel', 'CAPI'], required: true }, { name: 'adAccountId', label: 'Ad Account ID', type: 'text', required: true }] },
    { id: 'trade-desk', name: 'The Trade Desk', logo: '🏢', description: 'Activate to TTD platform',
      fields: [{ name: 'advertiserId', label: 'Advertiser ID', type: 'text', required: true }] },
    { id: 'amazon-dsp', name: 'Amazon DSP', logo: '📦', description: 'Activate to Amazon DSP',
      fields: [{ name: 'advertiserId', label: 'Advertiser ID', type: 'text', required: true }, { name: 'region', label: 'Region', type: 'select', options: ['US', 'EU', 'APAC'], required: true }] }
  ];

  const handleActivate = async () => {
    if (!selectedPlatform) return;
    const platform = platforms.find(p => p.id === selectedPlatform);
    if (!platform) return;
    const missingFields = platform.fields.filter(f => f.required && !platformConfig[f.name]).map(f => f.label);
    if (missingFields.length > 0) { toast({ title: "Missing Required Fields", description: `Please fill in: ${missingFields.join(', ')}`, variant: "destructive" }); return; }

    setIsActivating(true);
    const newJob: ActivationJob = { id: Date.now().toString(), platform: platform.name, status: 'queued', createdAt: new Date().toISOString(), config: platformConfig };
    setActivationJobs(prev => [newJob, ...prev]);
    setTimeout(() => { setActivationJobs(prev => prev.map(j => j.id === newJob.id ? { ...j, status: 'processing' } : j)); }, 1000);
    setTimeout(() => {
      const success = Math.random() > 0.3;
      setActivationJobs(prev => prev.map(j => j.id === newJob.id ? { ...j, status: success ? 'completed' : 'error', error: success ? undefined : 'Platform connection failed' } : j));
      toast({ title: success ? "Activation Complete" : "Activation Failed", description: success ? `Audience activated to ${platform.name}` : "Check config and retry", variant: success ? "default" : "destructive" });
    }, 4000);
    setSelectedPlatform(null); setPlatformConfig({}); setIsActivating(false);
  };

  const getStatusIcon = (status: ActivationJob['status']) => {
    switch (status) { case 'queued': return <Clock className="w-4 h-4 text-yellow-500" />; case 'processing': return <RefreshCw className="w-4 h-4 text-primary animate-spin" />; case 'completed': return <CheckCircle className="w-4 h-4 text-primary" />; case 'error': return <AlertCircle className="w-4 h-4 text-destructive" />; }
  };
  const getStatusColor = (status: ActivationJob['status']) => {
    switch (status) { case 'queued': return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'; case 'processing': return 'bg-primary/15 text-primary border border-primary/30'; case 'completed': return 'bg-primary/15 text-primary border border-primary/30'; case 'error': return 'bg-destructive/15 text-destructive border border-destructive/30'; }
  };

  const selectedPlatformData = platforms.find(p => p.id === selectedPlatform);
  const inputClasses = "w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary/50";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Activate Audience</h1>
        <p className="text-muted-foreground">Deploy your audience to advertising platforms</p>
      </div>

      {/* Audience Header */}
      <div className="bg-card rounded-xl p-6 neon-border">
        <h2 className="text-xl font-semibold text-foreground">{audience.name}</h2>
        <p className="text-muted-foreground">{audience.rowCount.toLocaleString()} total records</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {[
            { label: 'Email Addresses', value: audience.identityFields.email },
            { label: 'Phone Numbers', value: audience.identityFields.phone },
            { label: 'Customer IDs', value: audience.identityFields.customerId }
          ].map((item, i) => (
            <div key={i} className="bg-secondary/50 rounded-lg p-4">
              <div className="text-sm text-muted-foreground">{item.label}</div>
              <div className="text-2xl font-semibold text-foreground">{item.value.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Selection */}
      <div className="bg-card rounded-xl p-6 neon-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Select Activation Platform</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map(platform => (
            <button key={platform.id} onClick={() => { setSelectedPlatform(platform.id); setPlatformConfig({}); }}
              className={`p-4 rounded-xl border text-left transition-all ${selectedPlatform === platform.id ? 'border-primary/50 bg-primary/10' : 'border-border hover:border-primary/30 hover:bg-secondary/30'}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{platform.logo}</span>
                <div>
                  <div className="font-medium text-foreground">{platform.name}</div>
                  <div className="text-sm text-muted-foreground">{platform.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Platform Config */}
      {selectedPlatform && selectedPlatformData && (
        <div className="bg-card rounded-xl p-6 neon-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Configure {selectedPlatformData.name}</h3>
          <div className="space-y-4">
            {selectedPlatformData.fields.map(field => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-muted-foreground mb-2">{field.label} {field.required && <span className="text-primary">*</span>}</label>
                {field.type === 'select' ? (
                  <select value={platformConfig[field.name] || ''} onChange={(e) => setPlatformConfig(prev => ({...prev, [field.name]: e.target.value}))} className={inputClasses}>
                    <option value="">Select {field.label}</option>
                    {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type="text" value={platformConfig[field.name] || ''} onChange={(e) => setPlatformConfig(prev => ({...prev, [field.name]: e.target.value}))} className={inputClasses} placeholder={`Enter ${field.label}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <button onClick={handleActivate} disabled={isActivating}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${isActivating ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}>
              {isActivating ? 'Activating...' : 'Activate Audience'}
            </button>
          </div>
        </div>
      )}

      {/* Activation History */}
      {activationJobs.length > 0 && (
        <div className="bg-card rounded-xl p-6 neon-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Activation History</h3>
          <div className="space-y-3">
            {activationJobs.map(job => (
              <div key={job.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <div className="font-medium text-foreground">{job.platform}</div>
                    <div className="text-sm text-muted-foreground">{new Date(job.createdAt).toLocaleString()}</div>
                    {job.error && <div className="text-sm text-destructive mt-1">{job.error}</div>}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>{job.status.charAt(0).toUpperCase() + job.status.slice(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivateAudience;
