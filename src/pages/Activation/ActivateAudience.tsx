
import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { allAudiences } from '@/data/audiences';
import { useSavedAudiences } from '@/contexts/SavedAudiencesContext';
import metaLogo from '@/assets/meta-logo.png';
import dv360Logo from '@/assets/dv360-logo.png';
import googleAdsLogo from '@/assets/google-ads-logo.png';
import ttdLogo from '@/assets/ttd-logo.png';

const maskId = (id: string) => {
  if (id.length <= 3) return id;
  return '•'.repeat(id.length - 3) + id.slice(-3);
};

interface ActivationPlatform {
  id: string; name: string; logo: string; description: string;
  defaultConfig: Record<string, string>;
  fields: Array<{ name: string; label: string; type: 'text' | 'select'; options?: string[]; required: boolean; }>;
}

const ActivateAudience = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const { savedAudiences } = useSavedAudiences();

  const matchedAudience = useMemo(() => {
    return allAudiences.find(a => a.id === id) || savedAudiences.find(a => a.id === id);
  }, [id, savedAudiences]);

  const audienceName = matchedAudience?.name || 'Selected Audience';
  const audienceSize = matchedAudience?.size || '~15M';
  const audienceAttributes = matchedAudience?.attributes || [];

  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [platformConfig, setPlatformConfig] = useState<Record<string, string>>({});
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const platforms: ActivationPlatform[] = [
    { id: 'meta-ads', name: 'Meta Ads', logo: '📘', description: 'Activate to Meta/Facebook & Instagram Ads',
      defaultConfig: { integType: 'Custom Audience', adAccountId: 'act_9847362510' },
      fields: [{ name: 'integType', label: 'Integration Type', type: 'select', options: ['Custom Audience', 'CAPI'], required: true }, { name: 'adAccountId', label: 'Ad Account ID', type: 'text', required: true }] },
    { id: 'google-dv360', name: 'Google DV360', logo: '📊', description: 'Activate to Display & Video 360',
      defaultConfig: { partnerId: 'DV360-8734921', advertiserId: 'ADV-NF-IN-2026' },
      fields: [{ name: 'partnerId', label: 'Partner ID', type: 'text', required: true }, { name: 'advertiserId', label: 'Advertiser ID', type: 'text', required: true }] },
    { id: 'youtube', name: 'YouTube', logo: '▶️', description: 'Activate to YouTube Ads targeting',
      defaultConfig: { accountId: 'YT-NF-384756', matchType: 'Customer Match' },
      fields: [{ name: 'accountId', label: 'Google Account ID', type: 'text', required: true }, { name: 'matchType', label: 'Match Type', type: 'select', options: ['Customer Match', 'Similar Audiences'], required: true }] },
    { id: 'programmatic', name: 'Programmatic (TTD)', logo: '🏢', description: 'Activate to The Trade Desk programmatic',
      defaultConfig: { advertiserId: 'TTD-NF-IN-7291' },
      fields: [{ name: 'advertiserId', label: 'Advertiser ID', type: 'text', required: true }] }
  ];

  const handleSelectPlatform = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    setSelectedPlatform(platformId);
    // Mask the IDs
    const config: Record<string, string> = {};
    if (platform?.defaultConfig) {
      for (const [key, val] of Object.entries(platform.defaultConfig)) {
        config[key] = maskId(val);
      }
    }
    setPlatformConfig(config);
    setActivationSuccess(null);
  };

  const handleActivate = async () => {
    if (!selectedPlatform) return;
    const platform = platforms.find(p => p.id === selectedPlatform);
    if (!platform) return;

    setIsActivating(true);
    setTimeout(() => {
      setIsActivating(false);
      setActivationSuccess(platform.name);
      toast({ title: "Activation Complete", description: `Audience successfully pushed to ${platform.name}` });
    }, 3000);
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
          <span className="flex items-center gap-1"><User size={14} /> Created by: <strong className="text-foreground">Smit Srivastava</strong></span>
          <span>Created: <strong className="text-foreground">{matchedAudience?.created || '2026-03-15'}</strong></span>
        </div>
        <div className="text-xs text-muted-foreground mt-2">Attributes: {audienceAttributes.join(', ')}</div>
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
            <button key={platform.id} onClick={() => handleSelectPlatform(platform.id)}
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
      {selectedPlatform && selectedPlatformData && !activationSuccess && (
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
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${isActivating ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}>
              {isActivating ? 'Activating...' : 'Activate Audience'}
            </button>
          </div>
        </div>
      )}

      {/* Success */}
      {activationSuccess && (
        <div className="bg-card rounded-xl p-6 neon-border">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="text-primary" size={24} />
            <h3 className="text-lg font-bold text-foreground">Activation Successful</h3>
          </div>
          <p className="text-foreground">Audience successfully pushed to <strong>{activationSuccess}</strong></p>
          <p className="text-sm text-muted-foreground mt-2">It typically takes 24–48 hours for activation.</p>
        </div>
      )}
    </div>
  );
};

export default ActivateAudience;
