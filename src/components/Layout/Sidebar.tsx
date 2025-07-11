
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
    <div className={`bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} min-h-screen flex flex-col`}>
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              GDE Platform
            </h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
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
                  `flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-200 dark:border-blue-700'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
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
    </div>
  );
};

export default Sidebar;
