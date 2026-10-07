"use client";

import Sidebar from "@/components/Sidebar";
import { Header } from "@/components/Header";
import PageTransition from "@/components/PageTransition";
import RouteGuard from "@/components/RouteGuard";
import { usePathname } from "next/navigation";

/** Signed-out pages that render their own `main` landmark (the shared sign-in look). */
const OWN_MAIN_ROUTES = ["/", "/forgot-password", "/set-password", "/onboarding/setup"];

type LayoutShellProps = {
  children: React.ReactNode;
  showSidebar: boolean;
};

/**
 * The app shell in the portals' design: the sidebar (a drawer below 980px),
 * the top bar, and the scrolling page on the grey `tl-bg` canvas. Signed-in
 * pages go through the route guard; the sign-in, recovery and onboarding
 * pages render alone (`showSidebar` false).
 *
 * @param props - The page and whether it is a signed-in page.
 * @param props.children - The page.
 * @param props.showSidebar - True for signed-in pages, which get the sidebar, top bar and guard.
 * @returns The shell.
 */
export default function LayoutShell({ children, showSidebar }: LayoutShellProps) {
  const pathname = usePathname();

  if (!showSidebar) {
    // The sign-in family (SignInShell) and the setup wizard draw their own `main`.
    const Wrapper = OWN_MAIN_ROUTES.includes(pathname) ? "div" : "main";
    return (
      <Wrapper className="min-h-dvh bg-tl-bg font-manrope text-tl-ink">
        <PageTransition key={pathname}>{children}</PageTransition>
      </Wrapper>
    );
  }

  return (
    <div className="flex h-dvh min-h-dvh overflow-hidden bg-tl-bg font-manrope text-tl-ink">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="min-w-0 flex-1 overflow-y-auto bg-tl-bg">
          <PageTransition key={pathname}>
            <RouteGuard>{children}</RouteGuard>
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
