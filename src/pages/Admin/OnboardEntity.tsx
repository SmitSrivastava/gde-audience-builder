
import React, { useState } from 'react';
import { Plus, X, Cloud, Database, Key, Globe } from 'lucide-react';

interface EntityData {
  legalName: string; companyType: string; country: string; region: string; taxId: string;
  contactName: string; contactEmail: string; contactPhone: string; notes: string;
  roles: { client: boolean; dataPartner: boolean; };
}

interface CloudIntegration {
  type: 'AWS' | 'GCP' | 'Azure' | 'Snowflake';
  s3BucketUrl?: string; iamRoleArn?: string; externalId?: string; awsRegion?: string; kmsKeyArn?: string;
  gcsBucketUrl?: string; serviceAccountEmail?: string; projectId?: string; gcsRegion?: string; objectPrefix?: string;
  storageAccountName?: string; containerUrl?: string; sasToken?: string; directoryPath?: string;
  accountLocator?: string; shareName?: string; destinationDatabase?: string; warehouse?: string;
}

const OnboardEntity = () => {
  const [entityData, setEntityData] = useState<EntityData>({
    legalName: '', companyType: '', country: '', region: '', taxId: '',
    contactName: '', contactEmail: '', contactPhone: '', notes: '',
    roles: { client: false, dataPartner: false }
  });
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [selectedCloud, setSelectedCloud] = useState<string | null>(null);
  const [integrationData, setIntegrationData] = useState<CloudIntegration>({ type: 'AWS' });

  const cloudProviders = [
    { id: 'AWS', name: 'Amazon Web Services', icon: Cloud, color: 'bg-orange-600' },
    { id: 'GCP', name: 'Google Cloud Platform', icon: Database, color: 'bg-blue-600' },
    { id: 'Azure', name: 'Microsoft Azure', icon: Key, color: 'bg-blue-700' },
    { id: 'Snowflake', name: 'Snowflake', icon: Globe, color: 'bg-cyan-600' }
  ];
  const awsRegions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-south-1', 'ap-southeast-1'];
  const gcsRegions = ['us-central1', 'us-east1', 'europe-west1', 'asia-south1', 'asia-southeast1'];

  const inputClasses = "w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50";

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); console.log('Entity data:', entityData); };
  const handleIntegrationSubmit = async () => { console.log('Submitting integration:', integrationData); setShowIntegrationModal(false); setSelectedCloud(null); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Onboard Entity</h1>
        <p className="text-muted-foreground">Add a new client or data partner to the platform</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 neon-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: 'Legal Name *', key: 'legalName', required: true },
            { label: 'Country *', key: 'country', required: true },
            { label: 'Region', key: 'region' },
            { label: 'Tax ID', key: 'taxId' },
            { label: 'Contact Name *', key: 'contactName', required: true },
            { label: 'Contact Email *', key: 'contactEmail', type: 'email', required: true },
            { label: 'Contact Phone', key: 'contactPhone', type: 'tel' },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-muted-foreground mb-2">{field.label}</label>
              <input type={field.type || 'text'} value={(entityData as any)[field.key]}
                onChange={(e) => setEntityData({...entityData, [field.key]: e.target.value})}
                className={inputClasses} required={field.required} />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Company Type</label>
            <select value={entityData.companyType} onChange={(e) => setEntityData({...entityData, companyType: e.target.value})} className={inputClasses}>
              <option value="">Select type</option>
              <option value="Corporation">Corporation</option><option value="LLC">LLC</option>
              <option value="Partnership">Partnership</option><option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-muted-foreground mb-2">Notes</label>
          <textarea value={entityData.notes} onChange={(e) => setEntityData({...entityData, notes: e.target.value})} rows={4} className={inputClasses} />
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-muted-foreground mb-4">Entity Roles</label>
          <div className="flex gap-4">
            {(['client', 'dataPartner'] as const).map(role => (
              <label key={role} className="flex items-center">
                <input type="checkbox" checked={entityData.roles[role]}
                  onChange={(e) => setEntityData({...entityData, roles: {...entityData.roles, [role]: e.target.checked}})} className="sr-only" />
                <div className={`px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                  entityData.roles[role] ? 'bg-primary/15 border-primary/50 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'
                }`}>{role === 'client' ? 'Client' : 'Data Partner'}</div>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button type="button" onClick={() => setShowIntegrationModal(true)}
            className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg font-medium transition-colors flex items-center gap-2 border border-border">
            <Plus size={20} /> Add Integration
          </button>
          <button type="submit" className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors">Save Entity</button>
        </div>
      </form>

      {/* Integration Modal */}
      {showIntegrationModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto neon-border">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Add Cloud Integration</h2>
              <button onClick={() => { setShowIntegrationModal(false); setSelectedCloud(null); }} className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground"><X size={24} /></button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {cloudProviders.map(provider => (
                  <button key={provider.id} onClick={() => { setSelectedCloud(provider.id); setIntegrationData({ type: provider.id as CloudIntegration['type'] }); }}
                    className={`p-4 rounded-xl border transition-all ${selectedCloud === provider.id ? 'border-primary/50 bg-primary/10' : 'border-border hover:border-primary/30'}`}>
                    <div className={`w-12 h-12 ${provider.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                      <provider.icon size={24} className="text-white" />
                    </div>
                    <div className="text-sm font-medium text-foreground">{provider.name}</div>
                  </button>
                ))}
              </div>

              {selectedCloud === 'AWS' && (
                <div className="space-y-4">
                  {[
                    { label: 'S3 Bucket URL *', key: 's3BucketUrl', placeholder: 's3://my-bucket/' },
                    { label: 'IAM Role ARN *', key: 'iamRoleArn', placeholder: 'arn:aws:iam::123456789012:role/snowflake-access' },
                    { label: 'External ID *', key: 'externalId', placeholder: 'gde-client-123' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">{f.label}</label>
                      <input type="text" placeholder={f.placeholder} value={(integrationData as any)[f.key] || ''}
                        onChange={(e) => setIntegrationData({...integrationData, [f.key]: e.target.value})} className={inputClasses} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">AWS Region *</label>
                    <select value={integrationData.awsRegion || ''} onChange={(e) => setIntegrationData({...integrationData, awsRegion: e.target.value})} className={inputClasses}>
                      <option value="">Select region</option>
                      {awsRegions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">KMS Key ARN (Optional)</label>
                    <input type="text" placeholder="arn:aws:kms:..." value={integrationData.kmsKeyArn || ''}
                      onChange={(e) => setIntegrationData({...integrationData, kmsKeyArn: e.target.value})} className={inputClasses} />
                  </div>
                </div>
              )}

              {selectedCloud === 'GCP' && (
                <div className="space-y-4">
                  {[
                    { label: 'GCS Bucket URL *', key: 'gcsBucketUrl', placeholder: 'gs://my-bucket/' },
                    { label: 'Service Account Email *', key: 'serviceAccountEmail', placeholder: 'sa@project.iam.gserviceaccount.com' },
                    { label: 'Project ID *', key: 'projectId', placeholder: 'my-project-id' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">{f.label}</label>
                      <input type="text" placeholder={f.placeholder} value={(integrationData as any)[f.key] || ''}
                        onChange={(e) => setIntegrationData({...integrationData, [f.key]: e.target.value})} className={inputClasses} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">GCS Region *</label>
                    <select value={integrationData.gcsRegion || ''} onChange={(e) => setIntegrationData({...integrationData, gcsRegion: e.target.value})} className={inputClasses}>
                      <option value="">Select region</option>
                      {gcsRegions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {selectedCloud === 'Azure' && (
                <div className="space-y-4">
                  {[
                    { label: 'Storage Account Name *', key: 'storageAccountName', placeholder: 'mystorageaccount' },
                    { label: 'Container URL *', key: 'containerUrl', placeholder: 'https://account.blob.core.windows.net/container' },
                    { label: 'SAS Token *', key: 'sasToken', placeholder: '?sv=2021-06-08&ss=b...' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">{f.label}</label>
                      <input type="text" placeholder={f.placeholder} value={(integrationData as any)[f.key] || ''}
                        onChange={(e) => setIntegrationData({...integrationData, [f.key]: e.target.value})} className={inputClasses} />
                    </div>
                  ))}
                </div>
              )}

              {selectedCloud === 'Snowflake' && (
                <div className="space-y-4">
                  {[
                    { label: 'Account Locator *', key: 'accountLocator', placeholder: 'xy12345.us-east-1' },
                    { label: 'Share Name *', key: 'shareName', placeholder: 'SHARED_DATA' },
                    { label: 'Destination Database *', key: 'destinationDatabase', placeholder: 'PARTNER_DB' },
                    { label: 'Warehouse', key: 'warehouse', placeholder: 'COMPUTE_WH' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">{f.label}</label>
                      <input type="text" placeholder={f.placeholder} value={(integrationData as any)[f.key] || ''}
                        onChange={(e) => setIntegrationData({...integrationData, [f.key]: e.target.value})} className={inputClasses} />
                    </div>
                  ))}
                </div>
              )}

              {selectedCloud && (
                <div className="flex justify-end mt-6 gap-3">
                  <button onClick={() => setSelectedCloud(null)} className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                  <button onClick={handleIntegrationSubmit} className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors">Save Integration</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardEntity;
