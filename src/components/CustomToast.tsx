"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  /** Makes the toast clickable (e.g. open the chat it's about). Clicking also closes it. */
  onClick?: () => void;
  onClose: (id: string) => void;
}

/** Extra options for a toast. */
export interface ToastOptions {
  onClick?: () => void;
}

/**
 * One toast in the tl look: a white card with a coloured left edge, the
 * kind's icon, the title and message, Dismiss, and a bar that runs down
 * until it closes itself. Errors are alerts; the rest are status messages.
 *
 * @param props - See {@link ToastProps}.
 * @param props.id - Its id.
 * @param props.type - Success, error, warning or info.
 * @param props.title - The bold line.
 * @param props.message - The message.
 * @param props.duration - Milliseconds before it closes.
 * @param props.onClick - Makes it clickable.
 * @param props.onClose - Removes it.
 * @returns The toast.
 */
const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 4000,
  onClick,
  onClose,
}) => {
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

  /**
   * The icon and tl colours of the toast's kind.
   *
   * @returns The icon, its tile's colours, the left accent and the progress bar.
   */
  const getToastConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: CheckCircleIcon,
          bar: "bg-tl-success",
          accentColor: "border-l-tl-success",
          iconBg: "bg-tl-success-bg",
          iconColor: "text-tl-success",
        };
      case "error":
        return {
          icon: XCircleIcon,
          bar: "bg-tl-danger",
          accentColor: "border-l-tl-danger",
          iconBg: "bg-tl-danger-bg",
          iconColor: "text-tl-danger",
        };
      case "warning":
        return {
          icon: ExclamationTriangleIcon,
          bar: "bg-tl-warning",
          accentColor: "border-l-tl-warning",
          iconBg: "bg-tl-warning-bg",
          iconColor: "text-tl-warning",
        };
      default:
        return {
          icon: InformationCircleIcon,
          bar: "bg-tl-brand-fill",
          accentColor: "border-l-tl-brand",
          iconBg: "bg-tl-select",
          iconColor: "text-tl-brand",
        };
    }
  };

  const config = getToastConfig();
  const IconComponent = config.icon;

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`
        relative mb-3 flex w-full max-w-md items-start overflow-hidden rounded-[18px] border border-l-4 border-tl-line bg-tl-surface p-4 font-manrope text-tl-ink
        shadow-[0_20px_40px_-20px_rgba(15,27,46,0.35)] transition-all duration-300 ease-out
        ${config.accentColor}
        ${isVisible && !isLeaving ? "translate-y-0 scale-100 opacity-100" : "translate-y-[-20px] scale-95 opacity-0"}
      `}
    >
      {/* Icon Section */}
      <div
        aria-hidden
        className={`mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${config.iconBg}`}
      >
        <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
      </div>

      {/* Content Section */}
      <div
        className={`min-w-0 flex-1 ${onClick ? "cursor-pointer" : ""}`}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={
          onClick
            ? () => {
                onClick();
                handleClose();
              }
            : undefined
        }
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                  handleClose();
                }
              }
            : undefined
        }
      >
        {title && (
          <h4 className="mb-1 text-sm font-extrabold leading-tight text-tl-ink">{title}</h4>
        )}
        <p className="text-sm leading-relaxed text-tl-body">{message}</p>
      </div>

      {/* Close Button */}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={handleClose}
        className="-my-2 -mr-2 ml-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-tl-faint transition-colors hover:bg-tl-bg hover:text-tl-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tl-link"
      >
        <XMarkIcon className="h-5 w-5" aria-hidden />
      </button>

      {/* Progress Bar */}
      <div aria-hidden className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden bg-tl-track">
        <div
          className={`h-full ${config.bar} transition-all duration-300 ease-linear`}
          style={{
            animation: `shrink ${duration}ms linear`,
            transformOrigin: "left",
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
          <Toast key={toast.id} {...toast} onClose={onRemove} />
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

  addToast(toast: Omit<ToastProps, "id" | "onClose">) {
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
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
    this.emit();
  };

  private emit() {
    this.listeners.forEach((listener) => listener(this.toasts));
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
      toastManager.addToast({ type: "success", message, title, duration });
    },
    error: (message: string, title?: string, duration?: number) => {
      toastManager.addToast({ type: "error", message, title, duration });
    },
    warning: (message: string, title?: string, duration?: number) => {
      toastManager.addToast({ type: "warning", message, title, duration });
    },
    info: (message: string, title?: string, duration?: number) => {
      toastManager.addToast({ type: "info", message, title, duration });
    },
  };

  return { toast, toasts, removeToast: toastManager.removeToast };
};

export { ToastContainer };
export default Toast;

// Standalone toast object — usable outside React components (services, hooks, etc.)
export const toast = {
  success: (message: string, title?: string, duration?: number, options?: ToastOptions) =>
    toastManager.addToast({ type: "success", message, title, duration, ...options }),
  error: (message: string, title?: string, duration?: number, options?: ToastOptions) =>
    toastManager.addToast({ type: "error", message, title, duration, ...options }),
  warning: (message: string, title?: string, duration?: number, options?: ToastOptions) =>
    toastManager.addToast({ type: "warning", message, title, duration, ...options }),
  info: (message: string, title?: string, duration?: number, options?: ToastOptions) =>
    toastManager.addToast({ type: "info", message, title, duration, ...options }),
};
