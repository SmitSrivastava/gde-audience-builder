
import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { Plus, List } from 'lucide-react';
import CreateAudience from './CreateAudience';

const AudienceList = () => {
  const audiences = [
    { id: '1', name: 'High-Value Shoppers', created: '2024-01-15', count: 15420, status: 'Active' },
    { id: '2', name: 'Mobile App Users', created: '2024-01-14', count: 8932, status: 'Active' },
    { id: '3', name: 'Email Subscribers', created: '2024-01-13', count: 25670, status: 'Processing' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Your Audiences
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
                  <th className="text-left py-3 font-medium text-slate-700 dark:text-slate-300">Actions</th>
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
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors">
                          Enrich
                        </button>
                        <button className="px-3 py-1 bg-teal-500 hover:bg-teal-600 text-white text-sm rounded-lg transition-colors">
                          Activate
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Audience Segmentation
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Create and manage custom audience segments
        </p>
      </div>

      <div className="flex flex-wrap gap-4 border-b border-slate-200 dark:border-slate-700">
        <NavLink
          to="/segmentation"
          end
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-3 rounded-t-2xl font-medium transition-colors ${
              isActive
                ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-b-2 border-teal-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <List size={20} />
          Audience List
        </NavLink>
        <NavLink
          to="/segmentation/create"
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-3 rounded-t-2xl font-medium transition-colors ${
              isActive
                ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-b-2 border-teal-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
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
