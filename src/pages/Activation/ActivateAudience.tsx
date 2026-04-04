
import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Clock, AlertCircle, RefreshCw, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { allAudiences } from '@/data/audiences';

interface ActivationPlatform {
  id: string; name: string; logo: string; description: string;
  fields: Array<{ name: string; label: string; type: 'text' | 'select'; options?: string[]; required: boolean; }>;
}
interface ActivationJob { id: string; platform: string; status: 'queued' | 'processing' | 'completed' | 'error'; createdAt: string; config: Record<string, string>; error?: string; }

const ActivateAudience = () => {
  const { id } = useParams();
  const { toast } = useToast();

  const matchedAudience = useMemo(() => allAudiences.find(a => a.id === id), [id]);
  const audienceName = matchedAudience?.name || 'Selected Audience';
  const audienceSize = matchedAudience?.size || '~15M';

  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [platformConfig, setPlatformConfig] = useState<Record<string, string>>({});
  const [activationJobs, setActivationJobs] = useState<ActivationJob[]>([]);
  const [isActivating, setIsActivating] = useState(false);

  const platforms: ActivationPlatform[] = [
    { id: 'meta-ads', name: 'Meta Ads', logo: '📘', description: 'Activate to Meta/Facebook & Instagram Ads',
      fields: [{ name: 'integType', label: 'Integration Type', type: 'select', options: ['Custom Audience', 'CAPI'], required: true }, { name: 'adAccountId', label: 'Ad Account ID', type: 'text', required: true }] },
    { id: 'google-dv360', name: 'Google DV360', logo: '📊', description: 'Activate to Display & Video 360',
      fields: [{ name: 'partnerId', label: 'Partner ID', type: 'text', required: true }, { name: 'advertiserId', label: 'Advertiser ID', type: 'text', required: true }] },
    { id: 'youtube', name: 'YouTube', logo: '▶️', description: 'Activate to YouTube Ads targeting',
      fields: [{ name: 'accountId', label: 'Google Account ID', type: 'text', required: true }, { name: 'matchType', label: 'Match Type', type: 'select', options: ['Customer Match', 'Similar Audiences'], required: true }] },
    { id: 'programmatic', name: 'Programmatic (TTD)', logo: '🏢', description: 'Activate to The Trade Desk programmatic',
      fields: [{ name: 'advertiserId', label: 'Advertiser ID', type: 'text', required: true }] }
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
      setActivationJobs(prev => prev.map(j => j.id === newJob.id ? { ...j, status: 'completed' } : j));
      toast({ title: "Activation Complete", description: `Audience activated to ${platform.name} successfully` });
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
      <div className="hero-gradient rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[hsl(0_85%_50%/0.08)] rounded-full blur-[80px]"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">Activate Audience</h1>
          <p className="text-muted-foreground">Deploy your audience to advertising platforms</p>
        </div>
      </div>

      {/* Audience Header */}
      <div className="bg-card rounded-xl p-6 neon-border">
        <h2 className="text-xl font-semibold text-foreground mb-1">{audienceName}</h2>
        <div className="flex items-center gap-6 text-sm text-muted-foreground mt-2">
          <span>Size: <strong className="text-foreground">{audienceSize}</strong></span>
          <span className="flex items-center gap-1"><User size={14} /> Created by: <strong className="text-foreground">John Smith</strong></span>
          <span>Created: <strong className="text-foreground">{matchedAudience?.created || '2024-03-15'}</strong></span>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {matchedAudience?.activationPlatforms.map(p => (
            <span key={p} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded border border-primary/20">{p}</span>
          ))}
        </div>
      </div>

      {/* Platform Selection */}
      <div className="bg-card rounded-xl p-6 neon-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Select Destination Platform</h3>
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
