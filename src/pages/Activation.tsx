
import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Target, ArrowRight } from 'lucide-react';
import ActivateAudience from './Activation/ActivateAudience';

const ActivationHome = () => {
  const navigate = useNavigate();
  
  const audiences = [
    { id: '1', name: 'High-Value Shoppers', created: '2024-01-15', count: 15420, status: 'Active', enriched: true },
    { id: '2', name: 'Mobile App Users', created: '2024-01-14', count: 8932, status: 'Active', enriched: true },
    { id: '3', name: 'Email Subscribers', created: '2024-01-13', count: 25670, status: 'Processing', enriched: false }
  ];

  return (
    <div className="space-y-8">
      <div className="hero-gradient rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[hsl(0_85%_50%/0.08)] rounded-full blur-[80px]"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <Target className="text-primary" size={28} />
            <h1 className="text-3xl font-bold text-foreground">Audience Activation</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Activate your enriched audiences across advertising platforms and channels
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl neon-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Available Audiences for Activation</h2>
          <p className="text-sm text-muted-foreground mt-1">Deploy your audience segments to advertising platforms</p>
        </div>
        <div className="p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 font-semibold text-muted-foreground text-sm">Audience Name</th>
                <th className="text-left py-4 font-semibold text-muted-foreground text-sm">Created</th>
                <th className="text-left py-4 font-semibold text-muted-foreground text-sm">Records</th>
                <th className="text-left py-4 font-semibold text-muted-foreground text-sm">Status</th>
                <th className="text-left py-4 font-semibold text-muted-foreground text-sm">Enriched</th>
                <th className="text-left py-4 font-semibold text-muted-foreground text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {audiences.map((audience) => (
                <tr key={audience.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                  <td className="py-4 font-medium text-foreground">{audience.name}</td>
                  <td className="py-4 text-muted-foreground">{audience.created}</td>
                  <td className="py-4 text-muted-foreground">{audience.count.toLocaleString()}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      audience.status === 'Active'
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'bg-secondary text-muted-foreground'
                    }`}>{audience.status}</span>
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      audience.enriched
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'bg-secondary text-muted-foreground'
                    }`}>{audience.enriched ? 'Enriched' : 'Not Enriched'}</span>
                  </td>
                  <td className="py-4">
                    <button
                      onClick={() => navigate(`/activation/audiences/${audience.id}`)}
                      disabled={!audience.enriched}
                      className={`group flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                        audience.enriched
                          ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                      }`}
                    >
                      <span>Activate</span>
                      {audience.enriched && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Activation = () => (
  <Routes>
    <Route index element={<ActivationHome />} />
    <Route path="audiences/:id" element={<ActivateAudience />} />
  </Routes>
);

export default Activation;
