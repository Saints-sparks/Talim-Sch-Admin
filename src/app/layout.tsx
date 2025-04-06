"use client";

import localFont from "next/font/local";
import { Poppins } from "next/font/google";
import "./globals.css";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import LoadingProvider from "@/providers/LoadingProvider";
import { PageIndicatorProvider } from "./context/PageIndicatorContext";
import { SidebarProvider } from "@/context/SidebarContext";

import AppLayout from "@/components/layouts/AppLayout";
import AuthLayout from "@/components/layouts/AuthLayout";

// Font setup
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

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const noSidebarRoutes = ["/", "/account-section-1", "/account-section-2", "/signup", "/signin"];
  const isAuthRoute = noSidebarRoutes.includes(pathname);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken && !isAuthRoute) {
      toast.info("Your session has expired. Please log in again.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });

      router.push("/");
    }
  }, [pathname, router, isAuthRoute]);

  return (
    <LoadingProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased`}
        >
          <SidebarProvider>
            <PageIndicatorProvider>
              {isAuthRoute ? (
                <AuthLayout>{children}</AuthLayout>
              ) : (
                <AppLayout>{children}</AppLayout>
              )}
              <ToastContainer />
            </PageIndicatorProvider>
          </SidebarProvider>
        </body>
      </html>
    </LoadingProvider>
  );
}
