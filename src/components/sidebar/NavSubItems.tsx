"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Tooltip } from "@/components/ui/Tooltip";
import SmoothLink from "@/components/SmoothLink";
import { cn } from "@/lib/utils";
import { isSubItemActive, type NavSubItem } from "./navConfig";

interface NavSubItemsProps {
  /** Whether the group is open. */
  open: boolean;
  /** The sub-items this admin may see. */
  subItems: readonly NavSubItem[];
  pathname: string;
  onNavigate: (path: string) => void;
}

/**
 * The animated list of pages under an open group.
 *
 * @param props - Open state, the visible sub-items, the location and the click handler.
 * @returns The list, animating in and out.
 */
export function NavSubItems({ open, subItems, pathname, onNavigate }: NavSubItemsProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="ml-5 mt-1 space-y-1 overflow-hidden"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          {subItems.map((subItem, subIndex) => (
            <motion.div
              key={subItem.path}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ delay: subIndex * 0.05, duration: 0.2 }}
            >
              <Tooltip content={subItem.tooltip} side="right">
                <SmoothLink href={subItem.path}>
                  <motion.div
                    className={cn(
                      "flex items-center gap-3 py-2 px-3 rounded-md transition-all duration-200 relative",
                      isSubItemActive(pathname, subItem)
                        ? "text-[#003366] dark:text-blue-300 bg-[#003366]/10 font-medium"
                        : "text-[#4A5568] dark:text-slate-400 hover:text-[#030E18] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700",
                    )}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigate(subItem.path)}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0"></div>
                    <span className="text-sm font-medium">{subItem.label}</span>
                  </motion.div>
                </SmoothLink>
              </Tooltip>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
