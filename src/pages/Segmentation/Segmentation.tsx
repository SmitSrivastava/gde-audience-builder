
import React from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { Plus, List, ArrowRight } from 'lucide-react';
import CreateAudience from './CreateAudience';

const AudienceList = () => {
  const navigate = useNavigate();
  
  const audiences = [
    { id: '1', name: 'High-Value Shoppers', created: '2024-01-15', count: 15420, status: 'Active' },
    { id: '2', name: 'Mobile App Users', created: '2024-01-14', count: 8932, status: 'Active' },
    { id: '3', name: 'Email Subscribers', created: '2024-01-13', count: 25670, status: 'Processing' }
  ];

  const handleEnrich = (audienceId: string) => {
    navigate(`/enrichment/audiences/${audienceId}`);
  };

  const handleActivate = (audienceId: string) => {
    navigate(`/activation/audiences/${audienceId}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 card-gradient">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Your Audiences
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage and deploy your audience segments
          </p>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-600">
                  <th className="text-left py-4 font-semibold text-slate-700 dark:text-slate-300">Name</th>
                  <th className="text-left py-4 font-semibold text-slate-700 dark:text-slate-300">Created</th>
                  <th className="text-left py-4 font-semibold text-slate-700 dark:text-slate-300">Count</th>
                  <th className="text-left py-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                  <th className="text-left py-4 font-semibold text-slate-700 dark:text-slate-300">Actions</th>
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
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEnrich(audience.id)}
                          className="group flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm rounded-lg transition-all duration-300 font-medium"
                        >
                          <span>Enrich</span>
                          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button 
                          onClick={() => handleActivate(audience.id)}
                          className="group flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-sm rounded-lg transition-all duration-300 font-medium"
                        >
                          <span>Activate</span>
                          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
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

const Segmentation = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="hero-gradient rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <List className="text-blue-600 dark:text-blue-400" size={28} />
            <h1 className="text-3xl font-bold gradient-text">
              Audience Segmentation
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Create and manage custom audience segments from data partner datasets
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 border-b border-slate-200 dark:border-slate-700">
        <NavLink
          to="/segmentation"
          end
          className={({ isActive }) =>
            `flex items-center gap-2 px-6 py-3 rounded-t-2xl font-medium transition-all duration-300 ${
              isActive
                ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`
          }
        >
          <List size={20} />
          Audience List
        </NavLink>
        <NavLink
          to="/segmentation/create"
          className={({ isActive }) =>
            `flex items-center gap-2 px-6 py-3 rounded-t-2xl font-medium transition-all duration-300 ${
              isActive
                ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`
          }
        >
          <Plus size={20} />
          Create Audience
        </NavLink>
      </div>

      <Routes>
        <Route index element={<AudienceList />} />
        <Route path="create" element={<CreateAudience />} />
      </Routes>
    </div>
  );
};

export default Segmentation;
