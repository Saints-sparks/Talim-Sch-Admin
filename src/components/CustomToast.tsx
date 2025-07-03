"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, type, title, message, duration = 4000, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Show toast
    setIsVisible(true);

    // Auto-close timer
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircleIcon,
          bgGradient: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
          accentColor: 'border-emerald-400',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
        };
      case 'error':
        return {
          icon: XCircleIcon,
          bgGradient: 'bg-gradient-to-r from-red-500 to-red-600',
          accentColor: 'border-red-400',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
        };
      case 'warning':
        return {
          icon: ExclamationTriangleIcon,
          bgGradient: 'bg-gradient-to-r from-amber-500 to-amber-600',
          accentColor: 'border-amber-400',
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
        };
      case 'info':
        return {
          icon: InformationCircleIcon,
          bgGradient: 'bg-gradient-to-r from-[#154473] to-[#123961]',
          accentColor: 'border-[#154473]',
          iconBg: 'bg-blue-100',
          iconColor: 'text-[#154473]',
        };
      default:
        return {
          icon: InformationCircleIcon,
          bgGradient: 'bg-gradient-to-r from-gray-500 to-gray-600',
          accentColor: 'border-gray-400',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
        };
    }
  };

  const config = getToastConfig();
  const IconComponent = config.icon;

  return (
    <div
      className={`
        relative flex items-start p-4 mb-3 rounded-xl shadow-lg border-l-4 bg-white
        transform transition-all duration-300 ease-out max-w-md w-full
        ${config.accentColor}
        ${isVisible && !isLeaving 
          ? 'translate-y-0 opacity-100 scale-100' 
          : 'translate-y-[-20px] opacity-0 scale-95'
        }
        hover:shadow-xl hover:scale-[1.02]
      `}
      style={{
        fontFamily: 'Manrope, Arial, Helvetica, sans-serif',
      }}
    >
      {/* Icon Section */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center mr-3`}>
        <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
      </div>

      {/* Content Section */}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="text-sm font-semibold text-gray-900 mb-1 leading-tight">
            {title}
          </h4>
        )}
        <p className="text-sm text-gray-700 leading-relaxed">
          {message}
        </p>
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 group"
      >
        <XMarkIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 rounded-b-xl overflow-hidden">
        <div
          className={`h-full ${config.bgGradient} rounded-br-xl transition-all duration-300 ease-linear`}
          style={{
            animation: `shrink ${duration}ms linear`,
            transformOrigin: 'left',
          }}
        />
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
    </div>
  );
};

// Toast Container Component
interface ToastContainerProps {
  toasts: ToastProps[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
      <div className="flex flex-col items-center space-y-0 pointer-events-auto max-h-screen overflow-hidden">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={onRemove}
          />
        ))}
      </div>
    </div>,
    document.body
  );
};

// Toast Hook
let toastId = 0;

interface ToastManagerState {
  toasts: ToastProps[];
}

class ToastManager {
  private listeners: Set<(toasts: ToastProps[]) => void> = new Set();
  private toasts: ToastProps[] = [];

  subscribe(listener: (toasts: ToastProps[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot() {
    return this.toasts;
  }

  addToast(toast: Omit<ToastProps, 'id' | 'onClose'>) {
    const id = `toast-${++toastId}`;
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: this.removeToast.bind(this),
    };

    this.toasts = [newToast, ...this.toasts];
    this.emit();
  }

  removeToast = (id: string) => {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.emit();
  };

  private emit() {
    this.listeners.forEach(listener => listener(this.toasts));
  }
}

const toastManager = new ToastManager();

// Hook to use toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    setToasts(toastManager.getSnapshot());
    return () => {
      unsubscribe();
    };
  }, []);

  const toast = {
    success: (message: string, title?: string, duration?: number) => {
      toastManager.addToast({ type: 'success', message, title, duration });
    },
    error: (message: string, title?: string, duration?: number) => {
      toastManager.addToast({ type: 'error', message, title, duration });
    },
    warning: (message: string, title?: string, duration?: number) => {
      toastManager.addToast({ type: 'warning', message, title, duration });
    },
    info: (message: string, title?: string, duration?: number) => {
      toastManager.addToast({ type: 'info', message, title, duration });
    },
  };

  return { toast, toasts, removeToast: toastManager.removeToast };
};

export { ToastContainer };
export default Toast;
