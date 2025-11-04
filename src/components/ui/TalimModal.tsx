"use client";

import React from "react";
import { X } from "lucide-react";

interface TalimModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  isSubmitting?: boolean;
}

const TalimModal: React.FC<TalimModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  isSubmitting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-6">{children}</div>
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="flex-shrink-0 px-8 py-6 border-t border-gray-200 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default TalimModal;
