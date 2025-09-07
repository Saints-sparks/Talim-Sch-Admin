import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Talim School Admin",
    default: "Talim School Admin",
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
  metadataBase: new URL("https://talim-admin.com"), // Replace with your actual domain
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://talim-admin.com", // Replace with your actual domain
    siteName: "Talim School Admin",
    title: "Talim School Admin - Complete School Management System",
    description:
      "Streamline your school operations with Talim's comprehensive management system for students, teachers, classes, and assessments.",
    images: [
      {
        url: "/img/talim-og-image.png", // We'll create this
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
    images: ["/img/talim-twitter-image.png"], // We'll create this
    creator: "@talim_edu", // Replace with actual Twitter handle
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
  verification: {
    google: "your-google-verification-code", // Replace with actual verification code
    yandex: "your-yandex-verification-code", // Replace with actual verification code
  },
  category: "education",
  classification: "School Management System",
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
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/icons/apple-touch-icon-precomposed.png",
      },
    ],
  },
};
