
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Zap, 
  Target, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import netflixLogo from '@/assets/netflix-logo.png';
import familyBusiness from '@/assets/family-business.jpeg';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { role } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Segmentation', path: '/segmentation' },
    { icon: Zap, label: 'Enrichment', path: '/enrichment' },
    { icon: Target, label: 'Activation', path: '/activation' },
    ...(role === 'Admin' ? [{ icon: Settings, label: 'Admin', path: '/admin' }] : [])
  ];

  return (
    <div className={`bg-[hsl(0_0%_5%)] border-r border-border transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} min-h-screen flex flex-col`}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <img src={netflixLogo} alt="Netflix" className="h-6 object-contain" />
            </div>
          )}
          {collapsed && (
            <img src={netflixLogo} alt="Netflix" className="h-5 object-contain mx-auto" />
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/15 text-primary border border-primary/30 shadow-[0_0_12px_hsl(0_85%_50%/0.15)]'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`
                }
              >
                <item.icon size={20} />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Family Business Show image at bottom */}
      {!collapsed && (
        <div className="mt-auto p-3">
          <img
            src={familyBusiness}
            alt="Family Business"
            className="w-full rounded-xl opacity-30 object-cover"
            style={{ maxHeight: '280px' }}
          />
        </div>
      )}
    </div>
  );
};

export default Sidebar;
