
import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { Users, Database, Settings, FileSpreadsheet } from 'lucide-react';
import OnboardEntity from './OnboardEntity';
import GrantDatasetAccess from './GrantDatasetAccess';
import AttributeCatalog from './AttributeCatalog';

const Admin = () => {
  return (
    <div className="space-y-8">
      <div className="hero-gradient rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[hsl(0_85%_50%/0.08)] rounded-full blur-[80px]"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <Settings className="text-primary" size={28} />
            <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Manage entities, integrations, and data access permissions
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 border-b border-border">
        <NavLink to="/admin" end
          className={({ isActive }) =>
            `flex items-center gap-2 px-6 py-3 rounded-t-xl font-medium transition-all duration-300 ${
              isActive ? 'bg-primary/15 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
        >
          <Users size={20} /> Onboard Entity
        </NavLink>
        <NavLink to="/admin/dataset-access"
          className={({ isActive }) =>
            `flex items-center gap-2 px-6 py-3 rounded-t-xl font-medium transition-all duration-300 ${
              isActive ? 'bg-primary/15 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
        >
          <Database size={20} /> Grant Dataset Access
        </NavLink>
        <NavLink to="/admin/attribute-catalog"
          className={({ isActive }) =>
            `flex items-center gap-2 px-6 py-3 rounded-t-xl font-medium transition-all duration-300 ${
              isActive ? 'bg-primary/15 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
        >
          <FileSpreadsheet size={20} /> Attribute Catalog
        </NavLink>
      </div>

      <Routes>
        <Route index element={<OnboardEntity />} />
        <Route path="dataset-access" element={<GrantDatasetAccess />} />
        <Route path="attribute-catalog" element={<AttributeCatalog />} />
      </Routes>
    </div>
  );
};

export default Admin;
