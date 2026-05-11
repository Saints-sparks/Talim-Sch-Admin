"use client";
import { PageIndicatorProvider } from "./context/PageIndicatorContext";
import { TransitionProvider } from "@/context/TransitionContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { ToastContainer as ReactToastifyContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { usePathname, useRouter } from "next/navigation";

import { useEffect } from "react";
import { SidebarProvider } from "@/context/SidebarContext";
import LayoutShell from "@/components/LayoutShell";
import { ToastContainer, useToast } from "@/components/CustomToast";

// Inner shell — sits inside AuthProvider so it can read the user's schoolId
function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { toast, toasts, removeToast } = useToast();

  const noSidebarRoutes = [
    "/",
    "/account-section-1",
    "/account-section-2",
    "/onboarding",
    "/onboarding/setup",
    "/forgot-password",
  ];
  const showSidebar = !noSidebarRoutes.includes(pathname);

  const schoolId =
    user?.schoolId
      ? typeof user.schoolId === "string"
        ? user.schoolId
        : (user.schoolId as any)?._id ?? null
      : null;

  return (
    <OnboardingProvider schoolId={schoolId}>
      <TransitionProvider>
        <SidebarProvider>
          <PageIndicatorProvider>
            <WebSocketProvider>
              <LayoutShell showSidebar={showSidebar}>{children}</LayoutShell>
              <ToastContainer toasts={toasts} onRemove={removeToast} />
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
    </OnboardingProvider>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
