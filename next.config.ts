import type { NextConfig } from "next";
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const nextConfig: NextConfig = {
  // The Playwright suite sets NEXT_DIST_DIR so its dev server never shares `.next` with a build or `next dev` running elsewhere.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Your Next.js configuration options
  env: {
    // Explicitly expose environment variables to the client-side
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },
  // Other Next.js configuration options
};

export default nextConfig;