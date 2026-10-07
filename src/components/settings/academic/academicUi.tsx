import React from "react";
import { motion } from "framer-motion";

/** Table header cell classes shared by the year and term tables. */
export const TH = "px-4 py-3 text-left text-xs font-semibold text-tl-muted";
/** Table body cell classes shared by the year and term tables. */
export const TD = "px-4 py-3 text-tl-muted";
/** The panel surface of an inline create-form. */
export const FORM_PANEL = "p-5 border-b border-tl-line-soft bg-tl-subtle space-y-4";

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
