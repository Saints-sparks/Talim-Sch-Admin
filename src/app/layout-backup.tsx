"use client";
import localFont from "next/font/local";
import { Manrope } from "next/font/google";
import "./globals.css";
import { PageIndicatorProvider } from "./context/PageIndicatorContext";
import { TransitionProvider } from "@/context/TransitionContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import Head from "next/head";

import { usePathname, useRouter } from "next/navigation"; // Import usePathname and useRouter for routing

import { useEffect } from "react"; // Import useEffect for side effects
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

  const noSidebarRoutes = ["/", "/account-section-1", "/account-section-2", "/forgot-password"];
  const showSidebar = !noSidebarRoutes.includes(pathname);

  useEffect(() => {
    // Only check auth status on protected routes
    if (typeof window !== 'undefined' && !noSidebarRoutes.includes(pathname)) {
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
    <html lang="en">
      <Head>
        <title>Talim School Admin - Complete School Management System</title>
        <meta name="description" content="Talim School Admin is a comprehensive school management system designed to streamline administrative tasks, manage students, teachers, classes, assessments, and enhance educational operations with modern technology." />
        <meta name="keywords" content="school management system, educational software, student management, teacher management, class management, assessment system, school administration, academic management, education technology, school software, student information system, learning management" />
        <meta name="author" content="Talim Education Technology" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light" />
        
        {/* Favicon and Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/talim.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/talim.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://talim-admin.com/" />
        <meta property="og:title" content="Talim School Admin - Complete School Management System" />
        <meta property="og:description" content="Streamline your school operations with Talim's comprehensive management system for students, teachers, classes, and assessments." />
        <meta property="og:site_name" content="Talim School Admin" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://talim-admin.com/" />
        <meta property="twitter:title" content="Talim School Admin - Complete School Management System" />
        <meta property="twitter:description" content="Streamline your school operations with Talim's comprehensive management system." />
        
        {/* Additional Meta Tags */}
        <meta name="application-name" content="Talim School Admin" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Talim Admin" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="robots" content="index, follow" />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} antialiased`}
      >
        <TransitionProvider>
          <SidebarProvider>
            <PageIndicatorProvider>
              <WebSocketProvider>
                <LayoutShell showSidebar={showSidebar}>
                  {children}
                </LayoutShell>
                <ToastContainer toasts={toasts} onRemove={removeToast} />
              </WebSocketProvider>
            </PageIndicatorProvider>
          </SidebarProvider>
        </TransitionProvider>
      </body>
    </html>
  );
}
