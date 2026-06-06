import React from "react";
import type { Preview } from "@storybook/nextjs-vite";
import { ThemeProvider } from "../src/providers/theme-provider";

// Import global CSS so Tailwind classes and CSS variables resolve inside stories
import "../src/app/globals.css";

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
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <div className="font-sans antialiased p-4">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

export default preview;
