"use client";

import React from "react";
import SmoothLink from "@/components/SmoothLink";
import { focusRing } from "@/components/tl/styles";
import { isSubItemActive, type NavSubItem } from "./navConfig";

interface NavSubItemsProps {
  /** The id the group's button names in `aria-controls`. */
  id: string;
  /** Whether the group is open. */
  open: boolean;
  /** The sub-items this admin may see. */
  subItems: readonly NavSubItem[];
  pathname: string;
  onNavigate: (path: string) => void;
}

/**
 * The pages under an open group, indented under it with the portals' dot.
 *
 * @param props - Open state, the visible sub-items, the location and the click handler.
 * @param props.id - The list's id.
 * @param props.open - Whether the group is open.
 * @param props.subItems - The sub-items to list.
 * @param props.pathname - The current location.
 * @param props.onNavigate - Runs when a link is followed.
 * @returns The list, or null while the group is shut.
 */
export function NavSubItems({ id, open, subItems, pathname, onNavigate }: NavSubItemsProps) {
  if (!open) return null;
  return (
    <ul id={id} className="mt-0.5 flex flex-col gap-0.5">
      {subItems.map((subItem) => {
        const active = isSubItemActive(pathname, subItem);
        return (
          <li key={subItem.path}>
            <SmoothLink
              href={subItem.path}
              title={subItem.tooltip}
              aria-current={active ? "page" : undefined}
              onClick={() => onNavigate(subItem.path)}
              className={`flex min-h-[44px] items-center gap-3 rounded-[14px] py-2 pl-[42px] pr-3.5 text-sm transition-colors ${focusRing} ${
                active
                  ? "bg-tl-select font-extrabold text-tl-brand"
                  : "font-semibold text-tl-muted hover:bg-tl-bg hover:text-tl-ink"
              }`}
            >
              <span
                aria-hidden
                className={`h-[7px] w-[7px] shrink-0 rounded-full ${active ? "bg-tl-brand" : "bg-tl-control"}`}
              />
              <span className="truncate">{subItem.label}</span>
            </SmoothLink>
          </li>
        );
      })}
    </ul>
  );
}
