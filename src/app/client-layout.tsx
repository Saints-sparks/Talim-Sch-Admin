"use client";
import { PageIndicatorProvider } from "./context/PageIndicatorContext";
import { TransitionProvider } from "@/context/TransitionContext";
import { WebSocketProvider } from "@/context/WebSocketContext";

import { usePathname, useRouter } from "next/navigation";

import { useEffect } from "react";
import { SidebarProvider } from "@/context/SidebarContext";
import LayoutShell from "@/components/LayoutShell";
import { ToastContainer, useToast } from "@/components/CustomToast";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast, toasts, removeToast } = useToast();

  const noSidebarRoutes = [
    "/",
    "/account-section-1",
    "/account-section-2",
    "/signup",
    "/signin",
    "/forgot-password",
  ];
  const showSidebar = !noSidebarRoutes.includes(pathname);

  useEffect(() => {
    // Only check auth status on protected routes
    if (typeof window !== "undefined" && !noSidebarRoutes.includes(pathname)) {
      const checkAuthStatus = () => {
        const accessToken = localStorage.getItem("accessToken");

        if (!accessToken) {
          toast.info("Your session has expired. Please log in again.");
          router.push("/");
        }
      };

      // Small delay to prevent race conditions
      const timeoutId = setTimeout(checkAuthStatus, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [pathname, router, toast, noSidebarRoutes]);

  return (
    <TransitionProvider>
      <SidebarProvider>
        <PageIndicatorProvider>
          <WebSocketProvider>
            <LayoutShell showSidebar={showSidebar}>{children}</LayoutShell>
            <ToastContainer toasts={toasts} onRemove={removeToast} />
          </WebSocketProvider>
        </PageIndicatorProvider>
      </SidebarProvider>
    </TransitionProvider>
  );
}
