"use client";
import { PageIndicatorProvider } from "./context/PageIndicatorContext";
import { TransitionProvider } from "@/context/TransitionContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { usePathname } from "next/navigation";

import { useEffect, useRef } from "react";
import { SidebarProvider } from "@/context/SidebarContext";
import LayoutShell from "@/components/LayoutShell";
import { ToastContainer, useToast } from "@/components/CustomToast";
import { useOnboardingSync } from "@/hooks/useOnboardingSync";

const SYNC_THROTTLE_MS = 60_000; // re-check at most once per minute

// Silently syncs onboarding progress on login and on every route change
// (throttled). This means any step completed anywhere in the app is reflected
// in the checklist within one navigation.
function OnboardingSyncEffect() {
  const { syncProgress } = useOnboardingSync();
  const { user } = useAuth();
  const pathname = usePathname();
  const lastSyncAt = useRef(0);

  useEffect(() => {
    if (!user) return;
    const now = Date.now();
    if (now - lastSyncAt.current < SYNC_THROTTLE_MS) return;
    lastSyncAt.current = now;
    syncProgress().catch(() => {});
  }, [pathname, user?.userId]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// Inner shell — sits inside AuthProvider so it can read the user's schoolId
function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { toasts, removeToast } = useToast();

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
    <OnboardingProvider schoolId={schoolId} serverOnboardingCompleted={user?.onboardingCompleted}>
      <OnboardingSyncEffect />
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
