
import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { allAudiences, demoAudienceIds } from '@/data/audiences';
import { useSavedAudiences } from '@/contexts/SavedAudiencesContext';
import EnrichAudience from './Enrichment/EnrichAudience';

const EnrichmentHome = () => {
  const navigate = useNavigate();
  const { savedAudiences } = useSavedAudiences();

  const demoAudiences = allAudiences.filter(a => demoAudienceIds.includes(a.id) && a.status === 'Active');
  const allDisplayed = [...demoAudiences, ...savedAudiences];

  return (
    <div className="space-y-8">
      <div className="hero-gradient rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[hsl(0_85%_50%/0.08)] rounded-full blur-[80px]"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="text-primary" size={28} />
            <h1 className="text-3xl font-bold text-foreground">Data Enrichment</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Select an audience to enrich your client's dataset with external data partners
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl neon-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Available Audiences for Client Data Enrichment</h2>
          <p className="text-sm text-muted-foreground mt-1">Choose an audience segment to enhance your client's dataset</p>
        </div>
        <div className="p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 font-semibold text-muted-foreground text-sm">Audience Name</th>
                <th className="text-left py-4 font-semibold text-muted-foreground text-sm">Size</th>
                <th className="text-left py-4 font-semibold text-muted-foreground text-sm">Attributes</th>
                <th className="text-left py-4 font-semibold text-muted-foreground text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {allDisplayed.map((audience) => (
                <tr key={audience.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                  <td className="py-4">
                    <div className="font-medium text-foreground">{audience.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Attributes: {audience.attributes.join(', ')}</div>
                  </td>
                  <td className="py-4 text-muted-foreground">{audience.size}</td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-1">
                      {audience.attributes.slice(0, 3).map((a, i) => (
                        <span key={i} className="px-2 py-0.5 bg-secondary text-xs text-muted-foreground rounded">{a}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4">
                    <button
                      onClick={() => navigate(`/enrichment/audiences/${audience.id}`)}
                      className="group flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-sm rounded-lg font-medium transition-all border border-border"
                    >
                      <span>Enrich Client Data</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
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

const Enrichment = () => (
  <Routes>
    <Route index element={<EnrichmentHome />} />
    <Route path="audiences/:id" element={<EnrichAudience />} />
  </Routes>
);

export default Enrichment;
