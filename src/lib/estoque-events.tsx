'use client';
import { useState, createContext, useContext } from 'react';

interface EstoqueContextType {
  refreshKey: number;
  triggerRefresh: () => void;
}

const EstoqueContext = createContext<EstoqueContextType>({ refreshKey: 0, triggerRefresh: () => {} });

export function EstoqueProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  function triggerRefresh() { setRefreshKey(prev => prev + 1); }
  return <EstoqueContext.Provider value={{ refreshKey, triggerRefresh }}>{children}</EstoqueContext.Provider>;
}

export function useEstoqueRefresh() {
  return useContext(EstoqueContext);
}
