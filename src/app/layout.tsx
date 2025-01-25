"use client";

// app/layout.tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Poppins } from "next/font/google";
import "./globals.css";
import { PageIndicatorProvider } from "./context/PageIndicatorContext";
import Sidebar from "@/components/Sidebar";
import { usePathname } from "next/navigation"; // Import usePathname for routing
import classNames from "classnames"; // Import classnames

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

  // Define routes where the sidebar should be hidden
  const noSidebarRoutes = ["/", "/account-section-1", "/account-section-2"]; // Add any other routes as needed
  const showSidebar = !noSidebarRoutes.includes(pathname); // Determine if sidebar should be shown

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
        </PageIndicatorProvider>
      </body>
    </html>
  );
}