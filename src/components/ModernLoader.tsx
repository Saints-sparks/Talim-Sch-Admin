'use client';

import React from 'react';
import { useTransition } from '@/context/TransitionContext';
import { motion, AnimatePresence } from 'framer-motion';

const ModernLoader: React.FC = () => {
  const { isTransitioning } = useTransition();

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-col items-center space-y-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            <p className="text-sm font-medium text-gray-600">Loading...</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModernLoader;
