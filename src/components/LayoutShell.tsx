'use client';

import { useSidebar } from "@/context/SidebarContext";
import Sidebar from "@/components/Sidebar";
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

export default function LayoutShell({ children, showSidebar }: LayoutShellProps) {
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden">
      {showSidebar && (
        <motion.div
          initial={{ x: -260 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed left-0 top-0 h-full w-64 z-30"
        >
          <Sidebar />
        </motion.div>
      )}
      <motion.div
        className={classNames("flex-1 flex flex-col transition-all duration-300", {
          "ml-64": showSidebar,
          "ml-0": !showSidebar,
        })}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* <SchoolAdminNavbar user="Jessica" title="School Admin" /> */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <PageTransition key={pathname}>
            {children}
          </PageTransition>
        </main>
        <ModernLoader />
      </motion.div>
    </div>
  );
}
