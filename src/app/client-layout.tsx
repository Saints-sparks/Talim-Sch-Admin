"use client";
import { PageIndicatorProvider } from "./context/PageIndicatorContext";
import { TransitionProvider } from "@/context/TransitionContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastContainer as ReactToastifyContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

    "/forgot-password",
  ];
  const showSidebar = !noSidebarRoutes.includes(pathname);

  // Auth check is now handled by AuthContext, no need for manual localStorage check

  return (
    <AuthProvider>
      <TransitionProvider>
        <SidebarProvider>
          <PageIndicatorProvider>
            <WebSocketProvider>
              <LayoutShell showSidebar={showSidebar}>{children}</LayoutShell>
              <ToastContainer toasts={toasts} onRemove={removeToast} />
              {/* Fallback react-toastify container */}
              <ReactToastifyContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
            </WebSocketProvider>
          </PageIndicatorProvider>
        </SidebarProvider>
      </TransitionProvider>
    </AuthProvider>
  );
}
