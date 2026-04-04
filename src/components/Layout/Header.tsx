
import React from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { role, userName, clientName } = useAuth();

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground font-medium tracking-wide uppercase">
          Audience Intelligence Console
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-foreground">
              {userName}
            </div>
            <div className="text-xs text-muted-foreground">
              {role} {clientName && `• ${clientName}`}
            </div>
          </div>
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <User size={20} className="text-primary-foreground" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
