"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShieldOff, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AccessDeniedPage() {
  const router = useRouter();
  const { user, isSubAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <ShieldOff className="w-10 h-10 text-red-500 dark:text-red-400" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
          Access Denied
        </h1>

        <p className="text-gray-500 dark:text-slate-400 mb-2">
          You don&apos;t have permission to view this page.
        </p>

        {isSubAdmin && (
          <p className="text-sm text-gray-400 dark:text-slate-500 mb-6">
            Your account has limited permissions. Contact your school administrator
            if you believe this is a mistake.
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            onClick={() => router.replace("/dashboard")}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#003366] text-white hover:bg-[#002244] transition-colors text-sm font-medium"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
