
import React from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { Plus, List, Edit } from 'lucide-react';
import { allAudiences, demoAudienceIds } from '@/data/audiences';
import { useSavedAudiences } from '@/contexts/SavedAudiencesContext';
import CreateAudience from './CreateAudience';

const AudienceList = () => {
  const navigate = useNavigate();
  const { savedAudiences } = useSavedAudiences();

  const demoAudiences = allAudiences.filter(a => demoAudienceIds.includes(a.id) && a.status === 'Active');
  // Saved audiences at top, then demo
  const allDisplayed = [...savedAudiences, ...demoAudiences];

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl neon-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Your Audiences</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage and deploy your audience segments</p>
        </div>
        <div className="p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 font-semibold text-muted-foreground text-sm">Name</th>
                <th className="text-left py-4 font-semibold text-muted-foreground text-sm">Size</th>
                <th className="text-left py-4 font-semibold text-muted-foreground text-sm">Created</th>
                <th className="text-left py-4 font-semibold text-muted-foreground text-sm">Status</th>
                <th className="text-left py-4 font-semibold text-muted-foreground text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allDisplayed.map((audience) => (
                <tr key={audience.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                  <td className="py-4">
                    <button onClick={() => navigate(`/segmentation/create?audience=${audience.id}`)} className="text-left hover:text-primary transition-colors">
                      <div className="font-medium text-foreground">{audience.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Attributes: {audience.attributes.join(', ')}</div>
                    </button>
                  </td>
                  <td className="py-4 text-muted-foreground">{audience.size}</td>
                  <td className="py-4 text-muted-foreground">{audience.created}</td>
                  <td className="py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/30">
                      {audience.status}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/segmentation/create?audience=${audience.id}`)}
                        className="group flex items-center gap-1 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground text-sm rounded-lg transition-all font-medium border border-border"
                      >
                        <Edit size={14} />
                        <span>Edit</span>
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
  );
};

const Segmentation = () => {
  return (
    <div className="space-y-8">
      <div className="hero-gradient rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[hsl(0_85%_50%/0.08)] rounded-full blur-[80px]"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <List className="text-primary" size={28} />
            <h1 className="text-3xl font-bold text-foreground">Audience Segmentation</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Create and manage custom audience segments from data partner datasets
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 border-b border-border">
        <NavLink to="/segmentation" end
          className={({ isActive }) => `flex items-center gap-2 px-6 py-3 rounded-t-xl font-medium transition-all duration-300 ${isActive ? 'bg-primary/15 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}>
          <List size={20} /> Audience List
        </NavLink>
        <NavLink to="/segmentation/create"
          className={({ isActive }) => `flex items-center gap-2 px-6 py-3 rounded-t-xl font-medium transition-all duration-300 ${isActive ? 'bg-primary/15 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}>
          <Plus size={20} /> Create Audience
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
