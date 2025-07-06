'use client';

import React from 'react';
import { motion } from 'framer-motion';
import SmoothButton from './SmoothButton';

interface LoadingStateProps {
  message?: string;
}

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
}

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Loading..." 
}) => {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      />
      <p className="text-gray-600">{message}</p>
    </motion.div>
  );
};

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  title, 
  message, 
  onRetry, 
  retryText = "Try Again" 
}) => {
  return (
    <motion.div 
      className="text-center py-12 flex-1 flex items-center justify-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
        <motion.div 
          className="text-red-600 text-lg font-semibold mb-2"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, duration: 0.2 }}
        >
          {title}
        </motion.div>
        <p className="text-red-600 mb-4">{message}</p>
        {onRetry && (
          <SmoothButton
            onClick={onRetry}
            variant="primary"
            className="bg-red-600 hover:bg-red-700"
          >
            {retryText}
          </SmoothButton>
        )}
      </div>
    </motion.div>
  );
};

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  message, 
  actionText, 
  onAction 
}) => {
  return (
    <motion.div 
      className="text-center py-12 flex-1 flex items-center justify-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
        <motion.div 
          className="text-gray-400 text-6xl mb-4"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3, type: "spring" }}
        >
          {icon}
        </motion.div>
        <div className="text-gray-600 text-lg font-semibold mb-2">{title}</div>
        <p className="text-gray-500 mb-4">{message}</p>
        {actionText && onAction && (
          <SmoothButton
            onClick={onAction}
            variant="primary"
            className="bg-[#154473] hover:bg-blue-700"
          >
            {actionText}
          </SmoothButton>
        )}
      </div>
    </motion.div>
  );
};
