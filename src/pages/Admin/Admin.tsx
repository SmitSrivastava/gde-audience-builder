
import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { Users, Database, Settings } from 'lucide-react';
import OnboardEntity from './OnboardEntity';
import GrantDatasetAccess from './GrantDatasetAccess';

const Admin = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="hero-gradient rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-400/20 to-purple-600/20 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="text-indigo-600 dark:text-indigo-400" size={28} />
            <h1 className="text-3xl font-bold gradient-text">
              Admin Panel
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Manage entities, integrations, and data access permissions
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 border-b border-slate-200 dark:border-slate-700">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            `flex items-center gap-2 px-6 py-3 rounded-t-2xl font-medium transition-all duration-300 ${
              isActive
                ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`
          }
        >
          <Users size={20} />
          Onboard Entity
        </NavLink>
        <NavLink
          to="/admin/dataset-access"
          className={({ isActive }) =>
            `flex items-center gap-2 px-6 py-3 rounded-t-2xl font-medium transition-all duration-300 ${
              isActive
                ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`
          }
        >
          <Database size={20} />
          Grant Dataset Access
        </NavLink>
      </div>

      <Routes>
        <Route index element={<OnboardEntity />} />
        <Route path="dataset-access" element={<GrantDatasetAccess />} />
      </Routes>
    </div>
  );
};

export default Admin;
