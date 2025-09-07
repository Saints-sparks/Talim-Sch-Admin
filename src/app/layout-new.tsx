import type { Metadata } from "next";
import localFont from "next/font/local";
import { Manrope } from "next/font/google";
import "./globals.css";
import ClientLayout from "./client-layout";

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

// Google Font: Manrope
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Talim School Admin",
    default: "Talim School Admin - Complete School Management System",
  },
  description:
    "Talim School Admin is a comprehensive school management system designed to streamline administrative tasks, manage students, teachers, classes, assessments, and enhance educational operations with modern technology.",
  keywords: [
    "school management system",
    "educational software",
    "student management",
    "teacher management",
    "class management",
    "assessment system",
    "school administration",
    "academic management",
    "education technology",
    "school software",
    "student information system",
    "learning management",
  ],
  authors: [{ name: "Talim Education Technology" }],
  creator: "Talim Education Technology",
  publisher: "Talim Education Technology",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://talim-admin.com"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Talim School Admin",
    title: "Talim School Admin - Complete School Management System",
    description:
      "Streamline your school operations with Talim's comprehensive management system for students, teachers, classes, and assessments.",
    images: [
      {
        url: "/img/talim.png",
        width: 1200,
        height: 630,
        alt: "Talim School Admin Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Talim School Admin - Complete School Management System",
    description:
      "Streamline your school operations with Talim's comprehensive management system.",
    images: ["/img/talim.png"],
    creator: "@talim_edu",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "education",
  referrer: "origin-when-cross-origin",
  colorScheme: "light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2937" },
  ],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Talim Admin",
  },
  applicationName: "Talim School Admin",
  generator: "Next.js",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/talim.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/talim.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} antialiased`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
