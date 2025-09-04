"use client";

import { useSidebar } from "@/context/SidebarContext";
import Sidebar from "@/components/Sidebar";
import SchoolAdminNavbar from "@/components/Navbar";
import ModernLoader from "@/components/ModernLoader";
import PageTransition from "@/components/PageTransition";
import classNames from "classnames";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";

type LayoutShellProps = {
  children: React.ReactNode;
  showSidebar: boolean;
};

export default function LayoutShell({
  children,
  showSidebar,
}: LayoutShellProps) {
  const { isCollapsed, isMobile, setMobileOpen } = useSidebar();
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Always rendered, handles its own mobile responsiveness */}
      {showSidebar && <Sidebar />}

      <motion.div
        className="flex-1 flex flex-col transition-all duration-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Mobile Header with Hamburger Menu */}
        {showSidebar && isMobile && (
          <motion.div
            className="flex items-center justify-between p-4 bg-white border-b border-gray-200 md:hidden"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium text-gray-900">Talim</span>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </motion.div>
        )}

        {/* <SchoolAdminNavbar user="Jessica" title="School Admin" /> */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <PageTransition key={pathname}>{children}</PageTransition>
        </main>
        <ModernLoader />
      </motion.div>
    </div>
  );
}
