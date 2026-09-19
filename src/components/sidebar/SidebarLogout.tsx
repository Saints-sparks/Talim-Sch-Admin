"use client";

import React from "react";
import { motion } from "framer-motion";
import { Tooltip } from "@/components/ui/Tooltip";
import { Power } from "@/components/Icons";
import { cn } from "@/lib/utils";

interface SidebarLogoutProps {
  /** `icon` for the collapsed rail, `row` for the full sidebar. */
  variant: "icon" | "row";
  isLoggingOut: boolean;
  onLogout: () => void;
}

/** The spinner shown while signing out. */
function LogoutSpinner() {
  return <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />;
}

/**
 * The "Logout Account" control at the foot of the sidebar.
 *
 * @param props - Layout variant, the in-flight flag and the sign-out handler.
 * @returns The control.
 */
export function SidebarLogout({ variant, isLoggingOut, onLogout }: SidebarLogoutProps) {
  if (variant === "icon") {
    return (
      <div className="border-t border-[#F4F4F4] dark:border-slate-700 px-2 py-2">
        <Tooltip content="Logout Account" side="right">
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 mx-auto rounded-md cursor-pointer transition-all duration-200",
              isLoggingOut
                ? "bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed"
                : "text-[#4A5568] dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400",
            )}
            onClick={isLoggingOut ? undefined : onLogout}
          >
            {isLoggingOut ? <LogoutSpinner /> : <Power />}
          </div>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="border-t border-[#F4F4F4] dark:border-slate-700 px-3 py-2">
      <motion.div
        className={cn(
          "group flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-200",
          isLoggingOut
            ? "bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed"
            : "text-[#4A5568] dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400",
        )}
        whileTap={!isLoggingOut ? { scale: 0.98 } : {}}
        onClick={isLoggingOut ? undefined : onLogout}
      >
        <div className="flex items-center justify-center w-6 h-6">{isLoggingOut ? <LogoutSpinner /> : <Power />}</div>
        <span className="text-base font-medium">{isLoggingOut ? "Logging out..." : "Logout Account"}</span>
      </motion.div>
    </div>
  );
}
