import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { ThemeProvider } from "@/providers/theme-provider";

// ─── Mock user presets ────────────────────────────────────────────────────────

export const mockAdmin = {
  userId: "user-1",
  email: "admin@talim.test",
  role: "school_admin",
  permissions: [] as string[],
  schoolId: "school-1",
  isSubAdmin: false,
};

export const mockSubAdmin = {
  userId: "user-2",
  email: "sub@talim.test",
  role: "school_sub_admin",
  permissions: ["manage:students"] as string[],
  schoolId: "school-1",
  isSubAdmin: true,
};

// ─── Wrapper ──────────────────────────────────────────────────────────────────

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
    </ThemeProvider>
  );
}

// ─── Custom render ────────────────────────────────────────────────────────────

function renderWithProviders(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything so tests can import from one place
export * from "@testing-library/react";
export { renderWithProviders as render };
