
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  role: 'Admin' | 'Data Strategist' | 'Activation Ops';
  clientId: string | null;
  userName: string;
  clientName: string | null;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Mock auth data - in real app this would come from API
  const [authData] = useState<AuthContextType>({
    role: 'Admin',
    clientId: null,
    userName: 'John Smith',
    clientName: null
  });

  return (
    <AuthContext.Provider value={authData}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
