
import React, { useState } from 'react';
import { Plus, X, Cloud, Database, Key, Globe } from 'lucide-react';

interface EntityData {
  legalName: string;
  companyType: string;
  country: string;
  region: string;
  taxId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
  roles: {
    client: boolean;
    dataPartner: boolean;
  };
}

interface CloudIntegration {
  type: 'AWS' | 'GCP' | 'Azure' | 'Snowflake';
  // AWS fields
  s3BucketUrl?: string;
  iamRoleArn?: string;
  externalId?: string;
  awsRegion?: string;
  kmsKeyArn?: string;
  // GCP fields
  gcsBucketUrl?: string;
  serviceAccountEmail?: string;
  projectId?: string;
  gcsRegion?: string;
  objectPrefix?: string;
  // Azure fields
  storageAccountName?: string;
  containerUrl?: string;
  sasToken?: string;
  directoryPath?: string;
  // Snowflake fields
  accountLocator?: string;
  shareName?: string;
  destinationDatabase?: string;
  warehouse?: string;
}

const OnboardEntity = () => {
  const [entityData, setEntityData] = useState<EntityData>({
    legalName: '',
    companyType: '',
    country: '',
    region: '',
    taxId: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    notes: '',
    roles: {
      client: false,
      dataPartner: false
    }
  });

  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [selectedCloud, setSelectedCloud] = useState<string | null>(null);
  const [integrationData, setIntegrationData] = useState<CloudIntegration>({
    type: 'AWS'
  });

  const cloudProviders = [
    { id: 'AWS', name: 'Amazon Web Services', icon: Cloud, color: 'bg-orange-500' },
    { id: 'GCP', name: 'Google Cloud Platform', icon: Database, color: 'bg-blue-500' },
    { id: 'Azure', name: 'Microsoft Azure', icon: Key, color: 'bg-blue-600' },
    { id: 'Snowflake', name: 'Snowflake', icon: Globe, color: 'bg-cyan-500' }
  ];

  const awsRegions = [
    'us-east-1', 'us-west-2', 'eu-west-1', 'ap-south-1', 'ap-southeast-1'
  ];

  const gcsRegions = [
    'us-central1', 'us-east1', 'europe-west1', 'asia-south1', 'asia-southeast1'
  ];

  const validateFields = () => {
    if (!selectedCloud) return false;
    
    switch (selectedCloud) {
      case 'AWS':
        return integrationData.s3BucketUrl?.startsWith('s3://') && 
               integrationData.s3BucketUrl?.endsWith('/') &&
               integrationData.iamRoleArn?.startsWith('arn:aws:iam::') &&
               integrationData.externalId &&
               integrationData.awsRegion;
      case 'GCP':
        return integrationData.gcsBucketUrl?.startsWith('gs://') &&
               integrationData.gcsBucketUrl?.endsWith('/') &&
               integrationData.serviceAccountEmail?.endsWith('.iam.gserviceaccount.com') &&
               integrationData.projectId &&
               integrationData.gcsRegion;
      case 'Azure':
        return integrationData.storageAccountName &&
               integrationData.containerUrl?.includes('.blob.core.windows.net') &&
               integrationData.sasToken?.startsWith('?sv=');
      case 'Snowflake':
        return integrationData.accountLocator &&
               integrationData.shareName &&
               integrationData.destinationDatabase;
      default:
        return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Entity data:', entityData);
    // Here you would submit to your API
  };

  const handleIntegrationSubmit = async () => {
    try {
      // Mock API call
      console.log('Submitting integration:', integrationData);
      // Show success toast
      setShowIntegrationModal(false);
      setSelectedCloud(null);
    } catch (error) {
      console.error('Integration failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Onboard Entity
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Add a new client or data partner to the platform
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Legal Name *
            </label>
            <input
              type="text"
              value={entityData.legalName}
              onChange={(e) => setEntityData({...entityData, legalName: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Company Type
            </label>
            <select
              value={entityData.companyType}
              onChange={(e) => setEntityData({...entityData, companyType: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            >
              <option value="">Select type</option>
              <option value="Corporation">Corporation</option>
              <option value="LLC">LLC</option>
              <option value="Partnership">Partnership</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Country *
            </label>
            <input
              type="text"
              value={entityData.country}
              onChange={(e) => setEntityData({...entityData, country: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Region
            </label>
            <input
              type="text"
              value={entityData.region}
              onChange={(e) => setEntityData({...entityData, region: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tax ID
            </label>
            <input
              type="text"
              value={entityData.taxId}
              onChange={(e) => setEntityData({...entityData, taxId: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Contact Name *
            </label>
            <input
              type="text"
              value={entityData.contactName}
              onChange={(e) => setEntityData({...entityData, contactName: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Contact Email *
            </label>
            <input
              type="email"
              value={entityData.contactEmail}
              onChange={(e) => setEntityData({...entityData, contactEmail: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Contact Phone
            </label>
            <input
              type="tel"
              value={entityData.contactPhone}
              onChange={(e) => setEntityData({...entityData, contactPhone: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Notes
          </label>
          <textarea
            value={entityData.notes}
            onChange={(e) => setEntityData({...entityData, notes: e.target.value})}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-400 focus:border-transparent"
          />
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
            Entity Roles
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={entityData.roles.client}
                onChange={(e) => setEntityData({
                  ...entityData,
                  roles: {...entityData.roles, client: e.target.checked}
                })}
                className="sr-only"
              />
              <div className={`px-4 py-2 rounded-2xl border-2 cursor-pointer transition-all ${
                entityData.roles.client
                  ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-400 text-teal-600 dark:text-teal-400'
                  : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-teal-300'
              }`}>
                Client
              </div>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={entityData.roles.dataPartner}
                onChange={(e) => setEntityData({
                  ...entityData,
                  roles: {...entityData.roles, dataPartner: e.target.checked}
                })}
                className="sr-only"
              />
              <div className={`px-4 py-2 rounded-2xl border-2 cursor-pointer transition-all ${
                entityData.roles.dataPartner
                  ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-400 text-teal-600 dark:text-teal-400'
                  : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-teal-300'
              }`}>
                Data Partner
              </div>
            </label>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button
            type="button"
            onClick={() => setShowIntegrationModal(true)}
            className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Add Integration
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-medium transition-colors"
          >
            Save Entity
          </button>
        </div>
      </form>

      {/* Integration Modal */}
      {showIntegrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Add Cloud Integration
                </h2>
                <button
                  onClick={() => {
                    setShowIntegrationModal(false);
                    setSelectedCloud(null);
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {cloudProviders.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => {
                      setSelectedCloud(provider.id);
                      setIntegrationData({ type: provider.id as CloudIntegration['type'] });
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      selectedCloud === provider.id
                        ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20'
                        : 'border-slate-200 dark:border-slate-600 hover:border-teal-300'
                    }`}
                  >
                    <div className={`w-12 h-12 ${provider.color} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                      <provider.icon size={24} className="text-white" />
                    </div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {provider.name}
                    </div>
                  </button>
                ))}
              </div>

              {selectedCloud && (
                <div className="space-y-4">
                  {selectedCloud === 'AWS' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          S3 Bucket URL *
                        </label>
                        <input
                          type="text"
                          placeholder="s3://my-bucket/"
                          value={integrationData.s3BucketUrl || ''}
                          onChange={(e) => setIntegrationData({...integrationData, s3BucketUrl: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          IAM Role ARN *
                        </label>
                        <input
                          type="text"
                          placeholder="arn:aws:iam::123456789012:role/snowflake-access"
                          value={integrationData.iamRoleArn || ''}
                          onChange={(e) => setIntegrationData({...integrationData, iamRoleArn: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          External ID *
                        </label>
                        <input
                          type="text"
                          placeholder="gde-client-123"
                          value={integrationData.externalId || ''}
                          onChange={(e) => setIntegrationData({...integrationData, externalId: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          AWS Region *
                        </label>
                        <select
                          value={integrationData.awsRegion || ''}
                          onChange={(e) => setIntegrationData({...integrationData, awsRegion: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                        >
                          <option value="">Select region</option>
                          {awsRegions.map(region => (
                            <option key={region} value={region}>{region}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          KMS Key ARN (Optional)
                        </label>
                        <input
                          type="text"
                          value={integrationData.kmsKeyArn || ''}
                          onChange={(e) => setIntegrationData({...integrationData, kmsKeyArn: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                        />
                      </div>
                    </>
                  )}

                  <div className="pt-4">
                    <button
                      onClick={handleIntegrationSubmit}
                      disabled={!validateFields()}
                      className={`px-6 py-3 rounded-2xl font-medium transition-colors ${
                        validateFields()
                          ? 'bg-teal-500 hover:bg-teal-600 text-white'
                          : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Establish Connection
                    </button>
                  </div>
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
