import React from "react";
import { motion } from "framer-motion";

/** Table header cell classes shared by the year and term tables. */
export const TH = "px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400";
/** Table body cell classes shared by the year and term tables. */
export const TD = "px-4 py-3 text-gray-600 dark:text-slate-300";
/** The panel surface of an inline create-form. */
export const FORM_PANEL =
  "p-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 space-y-4";

/** The height animation both inline create-forms share. */
export function Collapsible({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden"
    >
      {children}
    </motion.div>
  );
}
