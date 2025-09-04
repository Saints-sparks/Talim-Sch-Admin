"use client";

import { useSidebar } from "@/context/SidebarContext";
import Sidebar from "@/components/Sidebar";
import { Header } from "@/components/Header";
import SchoolAdminNavbar from "@/components/Navbar";
import ModernLoader from "@/components/ModernLoader";
import PageTransition from "@/components/PageTransition";
import classNames from "classnames";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

type LayoutShellProps = {
  children: React.ReactNode;
  showSidebar: boolean;
};

export default function LayoutShell({
  children,
  showSidebar,
}: LayoutShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Always rendered, handles its own mobile responsiveness */}
      {showSidebar && <Sidebar />}

      <motion.div
        className="flex-1 flex flex-col transition-all duration-300 w-screen md:w-auto overflow-x-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header - Included in layout */}
        <Header />

        {/* <SchoolAdminNavbar user="Jessica" title="School Admin" /> */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <PageTransition key={pathname}>{children}</PageTransition>
        </main>
        <ModernLoader />
      </motion.div>
    </div>
  );
}
