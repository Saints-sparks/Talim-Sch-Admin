"use client";

import React from "react";
import { motion } from "framer-motion";
import { Tooltip } from "@/components/ui/Tooltip";
import SmoothLink from "@/components/SmoothLink";
import { ChevronDown } from "@/components/Icons";
import { cn } from "@/lib/utils";
import { NavBadge } from "./NavBadge";
import { NavIcon } from "./NavIcon";
import { NavSubItems } from "./NavSubItems";
import { isNavItemActive, visibleSubItems, type NavAccess, type NavItem } from "./navConfig";

interface NavItemRowProps {
  item: NavItem;
  /** Position in the list, used to stagger the entrance. */
  index: number;
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

const IDLE =
  "text-[#4A5568] dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-[#030E18] dark:hover:text-white";
const ACTIVE = "bg-[#003366]/20 text-[#003366] dark:text-blue-300";
const ROW = "group flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-200 relative";

/**
 * One entry of the expanded sidebar: a link, or a group that opens to reveal
 * the pages the admin may see.
 *
 * @param props - The entry, its state and the handlers.
 * @returns The entry with its sub-list.
 */
export function NavItemRow({ item, index, pathname, expanded, badge, access, onToggle, onNavigate }: NavItemRowProps) {
  const active = isNavItemActive(pathname, item);
  const isGroup = Boolean(item.subItems);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      {isGroup ? (
        <Tooltip content={item.tooltip} side="right">
          <motion.div
            className={cn(ROW, active || expanded ? ACTIVE : IDLE)}
            onClick={onToggle}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center w-6 h-6">
              <NavIcon icon={item.icon} active={active} />
            </div>
            <span className="text-base font-medium">{item.label}</span>
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }} className="ml-auto">
              <ChevronDown />
            </motion.div>
          </motion.div>
        </Tooltip>
      ) : (
        <Tooltip content={item.tooltip} side="right">
          <SmoothLink href={item.path}>
            <motion.div
              className={cn(ROW, active ? ACTIVE : IDLE)}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(item.path)}
            >
              <div className="flex items-center justify-center w-6 h-6">
                <NavIcon icon={item.icon} active={active} />
              </div>
              <span className="text-base font-medium">{item.label}</span>
              <NavBadge count={badge} variant="inline" />
            </motion.div>
          </SmoothLink>
        </Tooltip>
      )}

      {isGroup && (
        <NavSubItems
          open={expanded}
          subItems={visibleSubItems(item, access)}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      )}
    </motion.div>
  );
}
