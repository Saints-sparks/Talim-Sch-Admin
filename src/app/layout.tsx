"use client";
import localFont from "next/font/local";
import { Manrope } from "next/font/google";
import "./globals.css";
import { PageIndicatorProvider } from "./context/PageIndicatorContext";

import { usePathname, useRouter } from "next/navigation"; // Import usePathname and useRouter for routing

import { useEffect } from "react"; // Import useEffect for side effects
import LoadingProvider from '@/providers/LoadingProvider';
import { SidebarProvider } from "@/context/SidebarContext";
import LayoutShell from "@/components/LayoutShell";
import { ToastContainer, useToast } from "@/components/CustomToast";


// Local Fonts
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Google Font: Manrioe
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast, toasts, removeToast } = useToast();

  const noSidebarRoutes = ["/", "/account-section-1", "/account-section-2", "/signup", "/signin", "/forgot-password"];
  const showSidebar = !noSidebarRoutes.includes(pathname);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken && !noSidebarRoutes.includes(pathname)) {
      toast.info("Your session has expired. Please log in again.");

      router.push("/");
    }
  }, [pathname, router, toast]);

  return (
    <LoadingProvider>
    <html lang="en">
    <body
  className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} antialiased`}
>

        <SidebarProvider>
          <PageIndicatorProvider>
            <LayoutShell showSidebar={showSidebar}>
              {children}
            </LayoutShell>
            <ToastContainer toasts={toasts} onRemove={removeToast} />
          </PageIndicatorProvider>
        </SidebarProvider>
      </body>
    </html>
  </LoadingProvider>
  );
}
