
import React from 'react';
import { Users, Database, Zap, Target, TrendingUp, Activity, BarChart3, Sparkles } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    { label: 'Active Audiences', value: '247', icon: Users, color: 'from-blue-500 to-blue-600', trend: '+12%' },
    { label: 'Connected Datasets', value: '89', icon: Database, color: 'from-purple-500 to-purple-600', trend: '+8%' },
    { label: 'Enrichments Run', value: '1,234', icon: Zap, color: 'from-indigo-500 to-indigo-600', trend: '+24%' },
    { label: 'Activations', value: '456', icon: Target, color: 'from-violet-500 to-violet-600', trend: '+16%' }
  ];

  const recentActivities = [
    { text: 'New audience "High-Value Shoppers" created', time: '2 mins ago', type: 'create' },
    { text: 'Dataset "Customer Purchase History" enriched', time: '5 mins ago', type: 'enrich' },
    { text: 'Google Ads activation completed', time: '12 mins ago', type: 'activate' },
    { text: 'Azure integration established', time: '1 hour ago', type: 'integrate' }
  ];

  const quickActions = [
    {
      title: 'Create New Audience',
      description: 'Start building a new audience segment',
      icon: Users,
      gradient: 'from-blue-500 to-purple-600'
    },
    {
      title: 'Onboard Entity',
      description: 'Add a new client or data partner',
      icon: Database,
      gradient: 'from-purple-500 to-indigo-600'
    },
    {
      title: 'View Activations',
      description: 'Check activation status and performance',
      icon: Target,
      gradient: 'from-indigo-500 to-violet-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="hero-gradient rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-400/20 to-indigo-600/20 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="text-blue-600 dark:text-blue-400" size={28} />
            <h1 className="text-4xl font-bold gradient-text">
              Welcome to GroupM Data Exchange
            </h1>
          </div>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl">
            Unlock the power of your data with advanced segmentation, enrichment, and activation capabilities
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="group">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 card-gradient">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon size={24} className="text-white" />
                </div>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                  <TrendingUp size={16} />
                  {stat.trend}
                </div>
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 card-gradient">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Activity className="text-blue-600 dark:text-blue-400" size={24} />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Recent Activity
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-slate-900 dark:text-white font-medium">{activity.text}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 card-gradient">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-purple-600 dark:text-purple-400" size={24} />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Quick Actions
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {quickActions.map((action, index) => (
                <button key={index} className="w-full group">
                  <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-300 text-left">
                    <div className={`w-12 h-12 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {action.title}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {action.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
