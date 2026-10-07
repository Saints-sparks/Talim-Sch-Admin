"use client";

import React from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import SmoothLink from "@/components/SmoothLink";
import { focusRing } from "@/components/tl/styles";
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
 * One icon-only entry of the collapsed rail. Its label is the tooltip and the
 * accessible name. A group toggles instead of navigating; its pages are
 * reached by expanding the sidebar.
 *
 * @param props - The entry, the location, its badge and the handlers.
 * @param props.item - The entry.
 * @param props.pathname - The current location.
 * @param props.badge - Its unread count.
 * @param props.onToggle - Toggles a group.
 * @param props.onNavigate - Runs when a link is followed.
 * @returns The entry.
 */
export function CollapsedNavItem({
  item,
  pathname,
  badge,
  onToggle,
  onNavigate,
}: CollapsedNavItemProps) {
  const active = isNavItemActive(pathname, item);
  const tone = `relative mx-auto flex h-11 w-11 items-center justify-center rounded-[14px] transition-colors ${focusRing} ${
    active ? "bg-tl-select" : "hover:bg-tl-bg"
  }`;

  return (
    <li>
      <Tooltip content={item.label} side="right">
        {item.subItems ? (
          <button type="button" aria-label={item.label} onClick={onToggle} className={tone}>
            <NavIcon icon={item.icon} active={active} />
          </button>
        ) : (
          <SmoothLink
            href={item.path}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            onClick={() => onNavigate(item.path)}
            className={tone}
          >
            <NavIcon icon={item.icon} active={active} />
            <NavBadge count={badge} variant="floating" />
          </SmoothLink>
        )}
      </Tooltip>
    </li>
  );
}
