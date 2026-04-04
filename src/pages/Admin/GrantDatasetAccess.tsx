
import React, { useState } from 'react';
import { Check } from 'lucide-react';

interface Dataset { id: string; name: string; description: string; partner: string; granted: boolean; }

const GrantDatasetAccess = () => {
  const [selectedClient, setSelectedClient] = useState('');
  const [datasets, setDatasets] = useState<Dataset[]>([
    { id: '1', name: 'Customer Demographics', description: 'Age, gender, location data', partner: 'Acme Corp', granted: true },
    { id: '2', name: 'Purchase History', description: 'Transaction records and behaviors', partner: 'Retail Partners', granted: false },
    { id: '3', name: 'Web Analytics', description: 'Site interaction and engagement data', partner: 'Digital Agency', granted: true },
    { id: '4', name: 'Mobile App Usage', description: 'App usage patterns and preferences', partner: 'Tech Solutions', granted: false },
    { id: '5', name: 'Social Media Insights', description: 'Social engagement and sentiment data', partner: 'Social Corp', granted: false }
  ]);

  const clients = [
    { id: 'client-1', name: 'Global Retail Brand' },
    { id: 'client-2', name: 'Fashion E-commerce' },
    { id: 'client-3', name: 'Automotive Manufacturer' },
    { id: 'client-4', name: 'Financial Services' }
  ];

  const handleAccessToggle = (datasetId: string) => {
    setDatasets(datasets.map(d => d.id === datasetId ? { ...d, granted: !d.granted } : d));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Grant Dataset Access</h1>
        <p className="text-muted-foreground">Manage client access to available datasets</p>
      </div>

      <div className="bg-card rounded-xl p-6 neon-border">
        <div className="mb-6">
          <label className="block text-sm font-medium text-muted-foreground mb-3">Select Client</label>
          <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}
            className="w-full md:w-1/2 px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/50">
            <option value="">Choose a client...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {selectedClient && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Available Datasets</h3>
            <div className="space-y-3">
              {datasets.map(dataset => (
                <div key={dataset.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/30 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-foreground">{dataset.name}</h4>
                      <span className="px-3 py-1 text-xs font-medium bg-secondary text-muted-foreground rounded-full">{dataset.partner}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{dataset.description}</p>
                  </div>
                  <button onClick={() => handleAccessToggle(dataset.id)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${dataset.granted ? 'bg-primary' : 'bg-muted'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform ${dataset.granted ? 'translate-x-6' : 'translate-x-0.5'}`}>
                      {dataset.granted && <Check size={12} className="text-primary absolute inset-0 m-auto" />}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrantDatasetAccess;
