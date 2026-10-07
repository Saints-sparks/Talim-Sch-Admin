"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import SmoothLink from "@/components/SmoothLink";
import { focusRing } from "@/components/tl/styles";
import { NavBadge } from "./NavBadge";
import { NavIcon } from "./NavIcon";
import { NavSubItems } from "./NavSubItems";
import { isNavItemActive, visibleSubItems, type NavAccess, type NavItem } from "./navConfig";

interface NavItemRowProps {
  item: NavItem;
  pathname: string;
  /** Whether the item is a group and is open. */
  expanded: boolean;
  /** The unread count for this entry, if it shows one. */
  badge: number;
  access: NavAccess;
  /** Opens or closes the group. */
  onToggle: () => void;
  onNavigate: (path: string) => void;
}

/**
 * The classes of a sidebar row (the portals' nav row: 44px, radius 14, the
 * pale blue fill and navy text when current).
 *
 * @param active - Whether the row is the current section.
 * @returns The class string.
 */
export function navRowClass(active: boolean): string {
  return `flex min-h-[44px] w-full items-center gap-3 rounded-[14px] px-3.5 py-2.5 text-left text-[15px] transition-colors ${focusRing} ${
    active
      ? "bg-tl-select font-extrabold text-tl-brand"
      : "font-semibold text-tl-muted hover:bg-tl-bg hover:text-tl-ink"
  }`;
}

/**
 * One entry of the expanded sidebar: a link, or a group (Users, Transit) that
 * opens in place to reveal the pages the admin may see.
 *
 * @param props - The entry, its state and the handlers.
 * @param props.item - The entry.
 * @param props.pathname - The current location.
 * @param props.expanded - Whether the group is open.
 * @param props.badge - Its unread count.
 * @param props.access - What the admin may see.
 * @param props.onToggle - Opens or closes the group.
 * @param props.onNavigate - Runs when a link is followed.
 * @returns The entry with its sub-list.
 */
export function NavItemRow({
  item,
  pathname,
  expanded,
  badge,
  access,
  onToggle,
  onNavigate,
}: NavItemRowProps) {
  const active = isNavItemActive(pathname, item);

  if (item.subItems) {
    const listId = `nav-group-${item.path.replace(/\W+/g, "")}`;
    return (
      <li>
        <button
          type="button"
          title={item.tooltip}
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={onToggle}
          className={navRowClass(active)}
        >
          <NavIcon icon={item.icon} active={active} />
          <span className="flex-1 truncate">{item.label}</span>
          <ChevronDown
            aria-hidden
            className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
        <NavSubItems
          id={listId}
          open={expanded}
          subItems={visibleSubItems(item, access)}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      </li>
    );
  }

  return (
    <li>
      <SmoothLink
        href={item.path}
        title={item.tooltip}
        aria-current={active ? "page" : undefined}
        onClick={() => onNavigate(item.path)}
        className={navRowClass(active)}
      >
        <NavIcon icon={item.icon} active={active} />
        <span className="flex-1 truncate">{item.label}</span>
        <NavBadge count={badge} variant="inline" />
      </SmoothLink>
    </li>
  );
}
