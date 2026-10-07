"use client";

import React from "react";
import { versionLabel } from "@/lib/appVersion";

/**
 * The foot of the full sidebar: this build's version ("Version 1.5.0", read
 * from package.json), so anyone reporting a problem can quote it.
 *
 * @returns The footer.
 */
export function SidebarFooter() {
  return (
    <div className="px-3.5 pb-1 pt-3 text-xs font-semibold text-tl-muted" data-testid="app-version">
      {versionLabel()}
    </div>
  );
}
