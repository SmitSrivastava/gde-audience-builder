
import React from 'react';
import { Users, Database, Zap, Target } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    { label: 'Active Audiences', value: '247', icon: Users, color: 'bg-blue-500' },
    { label: 'Connected Datasets', value: '89', icon: Database, color: 'bg-green-500' },
    { label: 'Enrichments Run', value: '1,234', icon: Zap, color: 'bg-yellow-500' },
    { label: 'Activations', value: '456', icon: Target, color: 'bg-teal-500' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Welcome to GroupM Data Exchange Platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center`}>
                <stat.icon size={24} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {[
              'New audience "High-Value Shoppers" created',
              'Dataset "Customer Purchase History" enriched',
              'Google Ads activation completed',
              'Azure integration established'
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                <span className="text-slate-600 dark:text-slate-300">{activity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <div className="font-medium text-slate-900 dark:text-white">Create New Audience</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Start building a new audience segment</div>
            </button>
            <button className="w-full text-left p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <div className="font-medium text-slate-900 dark:text-white">Onboard Entity</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Add a new client or data partner</div>
            </button>
            <button className="w-full text-left p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <div className="font-medium text-slate-900 dark:text-white">View Activations</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Check activation status and performance</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
