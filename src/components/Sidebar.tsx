"use client";

import type React from "react";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { useSidebarNav, type SidebarNav } from "@/hooks/useSidebarNav";
import { CollapsedBrand, ExpandedBrand } from "./sidebar/SidebarBrand";
import { CollapsedNavItem } from "./sidebar/CollapsedNavItem";
import { NavItemRow } from "./sidebar/NavItemRow";
import { SidebarLogout } from "./sidebar/SidebarLogout";
import { SidebarFooter } from "./sidebar/SidebarFooter";
import { groupNavItems, type NavItem } from "./sidebar/navConfig";

type SidebarProps = React.ComponentProps<"nav"> & {
  className?: string;
};

/** The sidebar's surface: white, a hairline on the right, the portals' padding. */
const SURFACE = "flex flex-col border-r border-tl-line bg-tl-surface font-manrope text-tl-ink";

/**
 * The rows of the full sidebar: the titled groups, then Settings, Log out
 * and the version at the foot.
 *
 * @param props - The navigation state and the layout.
 * @param props.nav - What {@link useSidebarNav} returned.
 * @param props.isMobile - Whether this is the drawer.
 * @param props.schoolName - The school's name for the brand block.
 * @param props.onCloseMobile - Closes the drawer.
 * @param props.onCollapse - Collapses to the rail.
 * @returns The sidebar's content.
 */
function FullSidebarContent({
  nav,
  isMobile,
  schoolName,
  onCloseMobile,
  onCollapse,
}: {
  nav: SidebarNav;
  isMobile: boolean;
  schoolName: string;
  onCloseMobile: () => void;
  onCollapse: () => void;
}) {
  const { sections, account } = groupNavItems(nav.items);

  /**
   * One row with its live state.
   *
   * @param item - The entry.
   * @returns The row.
   */
  const row = (item: NavItem) => (
    <NavItemRow
      key={item.path}
      item={item}
      pathname={nav.pathname}
      expanded={nav.isGroupOpen(item.path)}
      badge={item.badge ? nav.badges[item.badge] : 0}
      access={nav.access}
      onToggle={() => nav.toggleGroup(item.path)}
      onNavigate={nav.handleLinkClick}
    />
  );

  return (
    <>
      <ExpandedBrand
        isMobile={isMobile}
        schoolName={schoolName}
        onCloseMobile={onCloseMobile}
        onCollapse={onCollapse}
      />

      <div className="flex-1">
        {sections.map((section, index) => (
          <div key={section.key} className={index === 0 ? "mt-5" : "mt-[18px]"}>
            <h2 className="px-3 pb-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-tl-faint">
              {section.title}
            </h2>
            <ul className="flex flex-col gap-0.5">{section.items.map(row)}</ul>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-0.5 border-t border-tl-line-soft pt-3.5">
        {account.length > 0 ? <ul className="flex flex-col gap-0.5">{account.map(row)}</ul> : null}
        <SidebarLogout variant="row" isLoggingOut={nav.isLoggingOut} onLogout={nav.handleLogout} />
        <SidebarFooter onNavigate={nav.handleLinkClick} />
      </div>
    </>
  );
}

/**
 * The app's navigation in the portals' design: the brand and school, the
 * entries in titled groups (Overview, Academics, People, Money,
 * Communication) with live badges, and Settings, Log out and the version at
 * the foot. At 980px and wider it sits beside the page and can collapse to an
 * icon rail; below that it is a drawer opened from the top bar's menu button
 * (Escape, the overlay or a link closes it).
 *
 * Entries are filtered by the signed-in admin's permissions, per sub-item;
 * see `sidebar/navConfig.ts` for the data and `useSidebarNav` for the
 * behaviour.
 *
 * @param _props - Unused; kept for the layout's call signature.
 * @returns The sidebar for the current layout.
 */
export default function Sidebar(_props: SidebarProps) {
  const nav = useSidebarNav();
  const { user } = useAuth();
  const { isMobile, isMobileOpen, setMobileOpen, isCollapsed, toggleCollapse } = useSidebar();
  const schoolName = user?.schoolName || "Your school";

  useEffect(() => {
    if (!isMobile || !isMobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobile, isMobileOpen, setMobileOpen]);

  // Collapsed desktop sidebar: the icon rail.
  if (!isMobile && isCollapsed) {
    return (
      <nav aria-label="Main" id="app-sidebar" className={`${SURFACE} h-screen w-[76px] shrink-0`}>
        <CollapsedBrand onExpand={toggleCollapse} />
        <ul className="mt-3 flex flex-1 flex-col gap-1 overflow-y-auto px-2 scrollbar-hide">
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
        </ul>
        <div className="border-t border-tl-line-soft px-2 py-3">
          <SidebarLogout
            variant="icon"
            isLoggingOut={nav.isLoggingOut}
            onLogout={nav.handleLogout}
          />
        </div>
      </nav>
    );
  }

  const content = (
    <FullSidebarContent
      nav={nav}
      isMobile={isMobile}
      schoolName={schoolName}
      onCloseMobile={() => setMobileOpen(false)}
      onCollapse={toggleCollapse}
    />
  );

  // Desktop: beside the page.
  if (!isMobile) {
    return (
      <nav
        aria-label="Main"
        id="app-sidebar"
        className={`${SURFACE} h-screen w-[264px] shrink-0 overflow-y-auto px-3.5 pb-4 pt-[22px]`}
      >
        {content}
      </nav>
    );
  }

  // Below 980px: a drawer over the page.
  return (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          <motion.div
            key="overlay"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[rgba(15,27,46,0.42)]"
            onClick={() => setMobileOpen(false)}
          />
          <motion.nav
            key="drawer"
            id="mobile-sidebar"
            aria-label="Main"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`${SURFACE} fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] overflow-y-auto px-3.5 pb-4 pt-[22px] shadow-[0_30px_70px_-30px_rgba(15,27,46,0.45)]`}
          >
            {content}
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
