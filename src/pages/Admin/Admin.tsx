
import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { Users, Database } from 'lucide-react';
import OnboardEntity from './OnboardEntity';
import GrantDatasetAccess from './GrantDatasetAccess';

const Admin = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Admin Panel
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Manage entities, integrations, and data access
        </p>
      </div>

      <div className="flex flex-wrap gap-4 border-b border-slate-200 dark:border-slate-700">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-3 rounded-t-2xl font-medium transition-colors ${
              isActive
                ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-b-2 border-teal-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <Users size={20} />
          Onboard Entity
        </NavLink>
        <NavLink
          to="/admin/dataset-access"
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-3 rounded-t-2xl font-medium transition-colors ${
              isActive
                ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-b-2 border-teal-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
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
