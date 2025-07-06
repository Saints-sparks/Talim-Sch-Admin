'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TabTransitionProps {
  children: React.ReactNode;
  activeTab: string;
  tabKey: string;
}

const TabTransition: React.FC<TabTransitionProps> = ({ children, activeTab, tabKey }) => {
  return (
    <AnimatePresence mode="wait">
      {activeTab === tabKey && (
        <motion.div
          key={tabKey}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0.0, 0.2, 1]
          }}
          className="w-full"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TabTransition;
