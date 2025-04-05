"use client";
import localFont from "next/font/local";
import { Poppins } from "next/font/google";
import "./globals.css";
import { PageIndicatorProvider } from "./context/PageIndicatorContext";

import { usePathname, useRouter } from "next/navigation"; // Import usePathname and useRouter for routing

import { ToastContainer, toast } from "react-toastify"; // Import ToastContainer and toast
import "react-toastify/dist/ReactToastify.css"; // Import the CSS for react-toastify
import { useEffect } from "react"; // Import useEffect for side effects
import LoadingProvider from '@/providers/LoadingProvider';
import { SidebarProvider } from "@/context/SidebarContext";
import LayoutShell from "@/components/LayoutShell";


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

// Google Font: Poppins
const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();

  const noSidebarRoutes = ["/", "/account-section-1", "/account-section-2", "/signup", "/signin"];
  const showSidebar = !noSidebarRoutes.includes(pathname);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken && !noSidebarRoutes.includes(pathname)) {
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
  }, [pathname, router, noSidebarRoutes]);

  return (
    <LoadingProvider>
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased`}
      >
        <SidebarProvider>
          <PageIndicatorProvider>
            <LayoutShell showSidebar={showSidebar}>
              {children}
            </LayoutShell>
            <ToastContainer
              position="top-center"
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
          </PageIndicatorProvider>
        </SidebarProvider>
      </body>
    </html>
  </LoadingProvider>
  );
}
