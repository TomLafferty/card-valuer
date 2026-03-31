import React, { createContext, useContext, ReactNode } from 'react';
import { useScanner, UseScannerReturn } from '../hooks/useScanner';

const ScannerContext = createContext<UseScannerReturn | null>(null);

interface ScannerProviderProps {
  children: ReactNode;
}

export const ScannerProvider: React.FC<ScannerProviderProps> = ({ children }) => {
  const scannerState = useScanner();

  return (
    <ScannerContext.Provider value={scannerState}>
      {children}
    </ScannerContext.Provider>
  );
};

export function useScannerContext(): UseScannerReturn {
  const context = useContext(ScannerContext);
  if (context === null) {
    throw new Error('useScannerContext must be used within a ScannerProvider');
  }
  return context;
}
