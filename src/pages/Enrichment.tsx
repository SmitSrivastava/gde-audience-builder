
import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Data Enrichment
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Select an audience to enrich with external datasets
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Available Audiences for Enrichment
          </h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-600">
                  <th className="text-left py-3 font-medium text-slate-700 dark:text-slate-300">Name</th>
                  <th className="text-left py-3 font-medium text-slate-700 dark:text-slate-300">Created</th>
                  <th className="text-left py-3 font-medium text-slate-700 dark:text-slate-300">Count</th>
                  <th className="text-left py-3 font-medium text-slate-700 dark:text-slate-300">Status</th>
                  <th className="text-left py-3 font-medium text-slate-700 dark:text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {audiences.map((audience) => (
                  <tr key={audience.id} className="border-b border-slate-100 dark:border-slate-700">
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
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {audience.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <button 
                        onClick={() => handleEnrich(audience.id)}
                        className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm rounded-xl font-medium transition-colors"
                      >
                        Enrich with External Data
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
