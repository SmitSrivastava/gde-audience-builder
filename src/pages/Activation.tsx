
import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import ActivateAudience from './Activation/ActivateAudience';

const ActivationHome = () => {
  const navigate = useNavigate();
  
  const audiences = [
    { id: '1', name: 'High-Value Shoppers', created: '2024-01-15', count: 15420, status: 'Active' },
    { id: '2', name: 'Mobile App Users', created: '2024-01-14', count: 8932, status: 'Active' },
    { id: '3', name: 'Email Subscribers', created: '2024-01-13', count: 25670, status: 'Processing' }
  ];

  const handleActivate = (audienceId: string) => {
    navigate(`/activation/audiences/${audienceId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Audience Activation
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Select an audience to activate on advertising platforms
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Available Audiences for Activation
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
                        onClick={() => handleActivate(audience.id)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-xl font-medium transition-colors"
                      >
                        Activate on Platforms
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

const Activation = () => {
  return (
    <Routes>
      <Route index element={<ActivationHome />} />
      <Route path="audiences/:id" element={<ActivateAudience />} />
    </Routes>
  );
};

export default Activation;
