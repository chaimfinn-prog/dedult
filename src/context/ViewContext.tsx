'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { ViewMode, PropertyAnalysis } from '@/types';

interface ViewContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedAnalysis: PropertyAnalysis | null;
  setSelectedAnalysis: (analysis: PropertyAnalysis | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (state: boolean) => void;
  activeSourceId: string | null;
  setActiveSourceId: (id: string | null) => void;
  showAuditTrail: boolean;
  setShowAuditTrail: (show: boolean) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>('homeowner');
  const [selectedAnalysis, setSelectedAnalysis] = useState<PropertyAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  return (
    <ViewContext.Provider
      value={{
        viewMode,
        setViewMode,
        selectedAnalysis,
        setSelectedAnalysis,
        isAnalyzing,
        setIsAnalyzing,
        activeSourceId,
        setActiveSourceId,
        showAuditTrail,
        setShowAuditTrail,
      }}
    >
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  const context = useContext(ViewContext);
  if (!context) throw new Error('useView must be used within a ViewProvider');
  return context;
}
