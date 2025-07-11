
import React from 'react';

const Enrichment = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Data Enrichment
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Enhance your audiences with additional data points
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔧</span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Enrichment Module
          </h3>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            The enrichment functionality will be available soon. This module will allow you to enhance your audience segments with additional first-party and third-party data sources.
          </p>
          <button className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-medium transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
};

export default Enrichment;
