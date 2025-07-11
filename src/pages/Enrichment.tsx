
import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import EnrichAudience from './Enrichment/EnrichAudience';

const EnrichmentHome = () => {
  const navigate = useNavigate();
  
  const audiences = [
    { id: '1', name: 'High-Value Shoppers', created: '2024-01-15', count: 15420, status: 'Active' },
    { id: '2', name: 'Mobile App Users', created: '2024-01-14', count: 8932, status: 'Active' },
    { id: '3', name: 'Email Subscribers', created: '2024-01-13', count: 25670, status: 'Processing' }
  ];

  const handleEnrich = (audienceId: string) => {
    navigate(`/enrichment/audiences/${audienceId}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="hero-gradient rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="text-blue-600 dark:text-blue-400" size={28} />
            <h1 className="text-3xl font-bold gradient-text">
              Data Enrichment
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Select an audience to enrich your client's dataset with external data partners
          </p>
        </div>
      </div>

      {/* Audiences Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 card-gradient">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Available Audiences for Client Data Enrichment
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Choose an audience segment to enhance your client's dataset
          </p>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-600">
                  <th className="text-left py-4 font-semibold text-slate-700 dark:text-slate-300">Audience Name</th>
                  <th className="text-left py-4 font-semibold text-slate-700 dark:text-slate-300">Created</th>
                  <th className="text-left py-4 font-semibold text-slate-700 dark:text-slate-300">Records</th>
                  <th className="text-left py-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                  <th className="text-left py-4 font-semibold text-slate-700 dark:text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {audiences.map((audience) => (
                  <tr key={audience.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 font-medium text-slate-900 dark:text-white">
                      {audience.name}
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">
                      {audience.created}
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">
                      {audience.count.toLocaleString()}
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        audience.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                      }`}>
                        {audience.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <button 
                        onClick={() => handleEnrich(audience.id)}
                        className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        <span>Enrich Client Data</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const Enrichment = () => {
  return (
    <Routes>
      <Route index element={<EnrichmentHome />} />
      <Route path="audiences/:id" element={<EnrichAudience />} />
    </Routes>
  );
};

export default Enrichment;
