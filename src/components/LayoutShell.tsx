'use client';

import { useSidebar } from "@/context/SidebarContext";
import Sidebar from "@/components/Sidebar";
import SchoolAdminNavbar from "@/components/Navbar";
import classNames from "classnames";

type LayoutShellProps = {
  children: React.ReactNode;
  showSidebar: boolean;
};

export default function LayoutShell({ children, showSidebar }: LayoutShellProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex">
      {showSidebar && (
        <Sidebar className="fixed left-0 top-0 h-full w-64 bg-black" />
      )}
      <div
        className={classNames("flex-1 transition-all duration-300", {
          // "ml-64": showSidebar && !isCollapsed,
          // "ml-20": showSidebar && isCollapsed,
        })}
      >
        {/* <SchoolAdminNavbar user="Jessica" title="School Admin" /> */}
        <main className="">{children}</main>
      </div>
    </div>
  );
}
