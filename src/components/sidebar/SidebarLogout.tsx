"use client";

import React from "react";
import { Loader2, LogOut } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { focusRing } from "@/components/tl/styles";

interface SidebarLogoutProps {
  /** `icon` for the collapsed rail, `row` for the full sidebar. */
  variant: "icon" | "row";
  isLoggingOut: boolean;
  onLogout: () => void;
}

/**
 * "Log out" at the foot of the sidebar (red on hover, as in the portals).
 *
 * @param props - Layout variant, the in-flight flag and the sign-out handler.
 * @param props.variant - Rail icon or full row.
 * @param props.isLoggingOut - Whether sign-out is running.
 * @param props.onLogout - Signs out.
 * @returns The control.
 */
export function SidebarLogout({ variant, isLoggingOut, onLogout }: SidebarLogoutProps) {
  const icon = isLoggingOut ? (
    <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden />
  ) : (
    <LogOut className="h-[18px] w-[18px]" aria-hidden />
  );
  const tone =
    "text-tl-muted hover:bg-tl-danger-bg hover:text-tl-danger disabled:cursor-not-allowed disabled:opacity-60";

  if (variant === "icon") {
    return (
      <Tooltip content="Log out" side="right">
        <button
          type="button"
          aria-label={isLoggingOut ? "Logging out" : "Log out"}
          onClick={onLogout}
          disabled={isLoggingOut}
          className={`mx-auto flex h-11 w-11 items-center justify-center rounded-[14px] transition-colors ${tone} ${focusRing}`}
        >
          {icon}
        </button>
      </Tooltip>
    );
  }

  return (
    <button
      type="button"
      title="Sign out of School Admin"
      onClick={onLogout}
      disabled={isLoggingOut}
      className={`flex min-h-[44px] w-full items-center gap-3 rounded-[14px] px-3.5 py-2.5 text-left text-[15px] font-semibold transition-colors ${tone} ${focusRing}`}
    >
      {icon}
      <span>{isLoggingOut ? "Logging out…" : "Log out"}</span>
    </button>
  );
}
