import React from "react";
import type { Preview } from "@storybook/nextjs-vite";
import { ThemeProvider } from "../src/providers/theme-provider";
import { AuthContext } from "../src/context/AuthContext";

// Import global CSS so Tailwind classes and CSS variables resolve inside stories
import "../src/app/globals.css";

// ─── Mock auth value used by every story ─────────────────────────────────────
// Represents a logged-in school_admin with full access.
// Override per-story via parameters.mockAuth if a story needs a sub-admin role.
const mockAuthValue = {
  user: {
    userId: "storybook-user",
    email: "admin@talim.test",
    firstName: "Story",
    lastName: "Admin",
    role: "school_admin",
    schoolId: "school-1",
    schoolName: "Talim Demo School",
    permissions: [] as string[],
    isSubAdmin: false,
  },
  accessToken: "mock-token",
  isAuthenticated: true,
  isLoading: false,
  isFullAdmin: true,
  isSubAdmin: false,
  hasPermission: () => true,
  login: async () => true,
  logout: async () => {},
  refreshToken: async () => true,
  setAccessToken: () => {},
  updateUser: () => {},
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "dark", value: "#0f172a" },
        { name: "dashboard", value: "#f8fafc" },
      ],
    },
    viewport: {
      viewports: {
        mobile: { name: "Mobile", styles: { width: "375px", height: "812px" } },
        tablet: { name: "Tablet", styles: { width: "768px", height: "1024px" } },
        desktop: { name: "Desktop", styles: { width: "1440px", height: "900px" } },
      },
      defaultViewport: "desktop",
    },
    // Enforce WCAG 2.1 AA in CI — change to 'todo' to downgrade to warnings only
    a11y: { test: "error" },
    nextjs: { appDirectory: true },
  },
  decorators: [
    (Story) => (
      <AuthContext.Provider value={mockAuthValue}>
        <ThemeProvider>
          <div className="font-sans antialiased p-4">
            <Story />
          </div>
        </ThemeProvider>
      </AuthContext.Provider>
    ),
  ],
};

export default preview;
