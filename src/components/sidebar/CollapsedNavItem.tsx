"use client";

import React from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import SmoothLink from "@/components/SmoothLink";
import { cn } from "@/lib/utils";
import { NavBadge } from "./NavBadge";
import { NavIcon } from "./NavIcon";
import { isNavItemActive, type NavItem } from "./navConfig";

interface CollapsedNavItemProps {
  item: NavItem;
  pathname: string;
  /** The unread count for this entry, if it shows one. */
  badge: number;
  /** Opens or closes the entry when it is a group. */
  onToggle: () => void;
  onNavigate: (path: string) => void;
}

/**
 * One icon-only entry of the collapsed sidebar. A group toggles instead of
 * navigating; its pages are reached by expanding the sidebar.
 *
 * @param props - The entry, the location, its badge and the handlers.
 * @returns The entry.
 */
export function CollapsedNavItem({ item, pathname, badge, onToggle, onNavigate }: CollapsedNavItemProps) {
  const active = isNavItemActive(pathname, item);
  const tone = active
    ? "bg-[#003366]/20 text-[#003366] dark:text-blue-300"
    : "text-[#4A5568] dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700";

  return (
    <Tooltip content={item.label} side="right">
      {item.subItems ? (
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 mx-auto rounded-md cursor-pointer transition-all duration-200",
            tone,
          )}
          onClick={onToggle}
        >
          <NavIcon icon={item.icon} active={active} />
        </div>
      ) : (
        <SmoothLink href={item.path}>
          <div
            className={cn(
              "relative flex items-center justify-center w-10 h-10 mx-auto rounded-md cursor-pointer transition-all duration-200",
              tone,
            )}
            onClick={() => onNavigate(item.path)}
          >
            <NavIcon icon={item.icon} active={active} />
            <NavBadge count={badge} variant="floating" />
          </div>
        </SmoothLink>
      )}
    </Tooltip>
  );
}
