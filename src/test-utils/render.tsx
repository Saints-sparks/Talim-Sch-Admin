import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthContext } from "@/context/AuthContext";

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

// ─── Mock auth context value ──────────────────────────────────────────────────

function makeMockAuthValue(user = mockAdmin) {
  return {
    user,
    accessToken: "mock-token",
    isAuthenticated: true,
    isLoading: false,
    isFullAdmin: user.role === "school_admin",
    isSubAdmin: user.role === "school_sub_admin",
    hasPermission: (permission: string) =>
      user.role === "school_admin" || user.permissions.includes(permission),
    login: jest.fn().mockResolvedValue(true),
    logout: jest.fn().mockResolvedValue(undefined),
    refreshToken: jest.fn().mockResolvedValue(true),
    setAccessToken: jest.fn(),
    updateUser: jest.fn(),
  };
}

// ─── Wrapper ──────────────────────────────────────────────────────────────────

function AllProviders({
  children,
  user = mockAdmin,
}: {
  children: React.ReactNode;
  user?: typeof mockAdmin;
}) {
  return (
    <AuthContext.Provider value={makeMockAuthValue(user)}>
      <ThemeProvider>{children}</ThemeProvider>
    </AuthContext.Provider>
  );
}

// ─── Custom render ────────────────────────────────────────────────────────────

function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions & { user?: typeof mockAdmin }
) {
  const { user, ...renderOptions } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => <AllProviders user={user}>{children}</AllProviders>,
    ...renderOptions,
  });
}

// Re-export everything so tests can import from one place
export * from "@testing-library/react";
export { renderWithProviders as render };
