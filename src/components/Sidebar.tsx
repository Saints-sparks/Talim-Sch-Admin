import type React from "react";

import { AnimatePresence, motion } from "framer-motion";
import { useSidebar } from "@/context/SidebarContext";
import { useSidebarNav } from "@/hooks/useSidebarNav";
import { CollapsedBrand, ExpandedBrand } from "./sidebar/SidebarBrand";
import { CollapsedNavItem } from "./sidebar/CollapsedNavItem";
import { NavItemRow } from "./sidebar/NavItemRow";
import { SidebarLogout } from "./sidebar/SidebarLogout";

type SidebarProps = React.ComponentProps<"nav"> & {
  className?: string;
};

/**
 * The app's navigation: an icon rail when collapsed, the full menu on desktop,
 * and a slide-in drawer on mobile. Entries are filtered by the signed-in
 * admin's permissions, per sub-item; see `sidebar/navConfig.ts` for the data
 * and `useSidebarNav` for the behaviour.
 *
 * @returns The sidebar for the current layout.
 */
export default function Sidebar(_props: SidebarProps) {
  const nav = useSidebarNav();
  const { isMobile, isMobileOpen, setMobileOpen, isCollapsed, toggleCollapse } = useSidebar();

  // Collapsed desktop sidebar — icon-only
  if (!isMobile && isCollapsed) {
    return (
      <motion.div
        className="h-screen w-16 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col shadow-sm shrink-0"
        initial={{ x: -288 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <CollapsedBrand onExpand={toggleCollapse} />

        <div className="flex-1 overflow-y-auto scrollbar-hide px-2 space-y-1 mt-3">
          {nav.items.map((item) => (
            <CollapsedNavItem
              key={item.path}
              item={item}
              pathname={nav.pathname}
              badge={item.badge ? nav.badges[item.badge] : 0}
              onToggle={() => nav.toggleGroup(item.path)}
              onNavigate={nav.handleLinkClick}
            />
          ))}
        </div>

        <SidebarLogout variant="icon" isLoggingOut={nav.isLoggingOut} onLogout={nav.handleLogout} />
      </motion.div>
    );
  }

  // Full sidebar content (mobile + expanded desktop)
  const sidebarContent = (
    <>
      <ExpandedBrand
        isMobile={isMobile}
        onCloseMobile={() => setMobileOpen(false)}
        onCollapse={toggleCollapse}
      />

      <div className="flex-1 overflow-y-auto scrollbar-hide px-3 space-y-1 mt-3">
        {nav.items.map((item, index) => (
          <NavItemRow
            key={item.path}
            item={item}
            index={index}
            pathname={nav.pathname}
            expanded={nav.isGroupOpen(item.path)}
            badge={item.badge ? nav.badges[item.badge] : 0}
            access={nav.access}
            onToggle={() => nav.toggleGroup(item.path)}
            onNavigate={nav.handleLinkClick}
          />
        ))}
      </div>

      <SidebarLogout variant="row" isLoggingOut={nav.isLoggingOut} onLogout={nav.handleLogout} />
    </>
  );

  // Desktop expanded sidebar
  if (!isMobile) {
    return (
      <motion.div
        className="h-screen w-[266px] bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col shadow-sm shrink-0"
        initial={{ x: -288 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {sidebarContent}
      </motion.div>
    );
  }

  // Mobile sidebar
  return (
    <>
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            id="mobile-sidebar"
            initial={{ x: -288 }}
            animate={{ x: 0 }}
            exit={{ x: -288 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed left-0 top-0 h-full w-[266px] bg-white dark:bg-slate-900 border-r border-[#F3F3F3] dark:border-slate-700 flex flex-col z-50 md:hidden shadow-2xl"
          >
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
