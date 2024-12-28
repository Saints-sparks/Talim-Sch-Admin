'use client'

import { createContext, useContext, useState, ReactNode } from 'react';

type PageIndicatorContextType = {
  currentPage: number;
  setCurrentPage: (page: number) => void;
};

const PageIndicatorContext = createContext<PageIndicatorContextType | undefined>(undefined);

export const PageIndicatorProvider = ({ children }: { children: ReactNode }) => {
  const [currentPage, setCurrentPage] = useState(0);

  return (
    <PageIndicatorContext.Provider value={{ currentPage, setCurrentPage }}>
      {children}
    </PageIndicatorContext.Provider>
  );
};

export const usePageIndicator = () => {
  const context = useContext(PageIndicatorContext);
  if (!context) {
    throw new Error('usePageIndicator must be used within a PageIndicatorProvider');
  }
  return context;
};
