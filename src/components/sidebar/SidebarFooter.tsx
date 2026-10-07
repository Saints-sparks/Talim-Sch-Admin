"use client";

import React from "react";
import { LifeBuoy } from "lucide-react";
import SmoothLink from "@/components/SmoothLink";
import { focusRing } from "@/components/tl/styles";
import { versionLabel } from "@/lib/appVersion";

/**
 * The foot of the full sidebar: "Help & support" (the admin's own tickets to
 * Talim, open to every admin) and this build's version ("Version 1.5.0",
 * read from package.json), so anyone reporting a problem can quote it.
 *
 * @param props - The link handler.
 * @param props.onNavigate - Runs when the link is followed (closes the drawer).
 * @returns The footer.
 */
export function SidebarFooter({ onNavigate }: { onNavigate?: (path: string) => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      <SmoothLink
        href="/help"
        title="Contact Talim support and see your tickets"
        onClick={() => onNavigate?.("/help")}
        className={`flex min-h-[44px] items-center gap-3 rounded-[14px] px-3.5 py-2.5 text-[15px] font-semibold text-tl-muted transition-colors hover:bg-tl-bg hover:text-tl-ink ${focusRing}`}
      >
        <LifeBuoy className="h-[18px] w-[18px]" aria-hidden />
        <span>Help &amp; support</span>
      </SmoothLink>
      <div
        className="px-3.5 pb-1 pt-2 text-xs font-semibold text-tl-muted"
        data-testid="app-version"
      >
        {versionLabel()}
      </div>
    </div>
  );
}
