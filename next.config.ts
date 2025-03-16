import type { NextConfig } from "next";
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const nextConfig: NextConfig = {
  // Your Next.js configuration options
  env: {
    // Explicitly expose environment variables to the client-side
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },
  // Other Next.js configuration options
};

export default nextConfig;