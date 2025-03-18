"use client";

import type { Metadata } from "next";
import localFont from "next/font/local";
import { Poppins } from "next/font/google";
import "./globals.css";
import { PageIndicatorProvider } from "./context/PageIndicatorContext";
import Sidebar from "@/components/Sidebar";
import { usePathname, useRouter } from "next/navigation"; // Import usePathname and useRouter for routing
import classNames from "classnames"; // Import classnames
import { ToastContainer, toast } from "react-toastify"; // Import ToastContainer and toast
import "react-toastify/dist/ReactToastify.css"; // Import the CSS for react-toastify
import { useEffect } from "react"; // Import useEffect for side effects

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
  const pathname = usePathname(); // Get current route
  const router = useRouter(); // Get router instance

  // Define routes where the sidebar should be hidden
  const noSidebarRoutes = ["/", "/account-section-1", "/account-section-2", "/signup", "/signin"]; // Add any other routes as needed
  const showSidebar = !noSidebarRoutes.includes(pathname); // Determine if sidebar should be shown

  // Check for accessToken on page load
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    // If no accessToken is found and the user is on a protected route, redirect to login
    if (!accessToken && !noSidebarRoutes.includes(pathname)) {
      // Show a toast notification
      toast.info("Your session has expired. Please log in again.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });

      // Redirect to the login page
      router.push("/");
    }
  }, [pathname, router, noSidebarRoutes]);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased`}
      >
        <PageIndicatorProvider>
          {/* Main layout structure */}
          <div className="flex">
            {showSidebar && (
              <Sidebar className="fixed left-0 top-0 h-full w-64 bg-black" />
            )}
            <main className={classNames("flex-1 p-4", { "ml-64": showSidebar })}>
              {children}
            </main>
          </div>
          {/* Add ToastContainer here */}
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
      </body>
    </html>
  );
}