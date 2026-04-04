
import React, { createContext, useContext, useState } from 'react';
import type { SubAudience } from '@/data/audiences';

interface SavedAudiencesContextType {
  savedAudiences: SubAudience[];
  addAudience: (audience: SubAudience) => void;
}

const SavedAudiencesContext = createContext<SavedAudiencesContextType | undefined>(undefined);

export const SavedAudiencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedAudiences, setSavedAudiences] = useState<SubAudience[]>([]);

  const addAudience = (audience: SubAudience) => {
    setSavedAudiences(prev => {
      if (prev.find(a => a.id === audience.id)) return prev;
      return [...prev, audience];
    });
  };

  return (
    <SavedAudiencesContext.Provider value={{ savedAudiences, addAudience }}>
      {children}
    </SavedAudiencesContext.Provider>
  );
};

export const useSavedAudiences = () => {
  const context = useContext(SavedAudiencesContext);
  if (context === undefined) {
    throw new Error('useSavedAudiences must be used within a SavedAudiencesProvider');
  }
  return context;
};
