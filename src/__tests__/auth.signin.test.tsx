/** @jest-environment jsdom */
/**
 * The auth pages in the shared Talim sign-in look (group 11): the "Admin"
 * pill and the words and labels the e2e suite signs in with; the sign-in
 * behaviour (login with "keep me signed in", the post-login route, the three
 * banners); set-password and forgot-password keep their fields and their
 * `main` landmark.
 */
import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, mockAdmin } from "@/test-utils/render";
import SignIn from "@/app/page";
import SetPasswordPage from "@/app/set-password/page";
import ForgotPassword from "@/app/forgot-password/page";
import { classifyLoginError } from "@/components/auth/signInError";
import { AuthContext } from "@/context/AuthContext";

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <span data-alt={alt} />,
}));
jest.mock("@/components/CustomToast", () => {
  const toast = { success: jest.fn(), error: jest.fn(), info: jest.fn(), warning: jest.fn() };
  return { toast, useToast: () => ({ toast, toasts: [], removeToast: jest.fn() }) };
});
// The full-screen loader reads the route-transition context; it is only decoration here.
jest.mock("@/components/ModernLoader", () => ({
  __esModule: true,
  default: ({ visible }: { visible?: boolean }) =>
    visible ? <div role="progressbar" aria-label="Signing in" /> : null,
}));
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("@/app/services/auth.service", () => ({
  authService: { forgotPassword: jest.fn(), verifyResetOtp: jest.fn(), resetPassword: jest.fn() },
}));

/**
 * Renders a page with an auth context whose `login` (and user) the test sets.
 *
 * @param ui - The page.
 * @param overrides - Auth values to replace.
 * @returns The render result.
 */
function renderWithAuth(ui: React.ReactElement, overrides: Record<string, unknown>) {
  const base = {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    isFullAdmin: false,
    schoolId: null,
    isSubAdmin: false,
    hasPermission: () => false,
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    setAccessToken: jest.fn(),
    updateUser: jest.fn(),
    changePassword: jest.fn(),
  };
  const value = { ...base, ...overrides } as unknown as React.ContextType<typeof AuthContext>;
  return render(<AuthContext.Provider value={value}>{ui}</AuthContext.Provider>);
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe("sign-in", () => {
  it("shows the shared look with the Admin pill and the words the e2e suite uses", () => {
    renderWithAuth(<SignIn />, {});
    expect(screen.getByRole("main")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1, name: "Welcome back" })).toBeTruthy();
    expect(screen.getByText("Admin")).toBeTruthy();
    expect(screen.getByLabelText("Email address")).toHaveAttribute("id", "email");
    expect(screen.getByLabelText("Password", { selector: "input" })).toHaveAttribute(
      "id",
      "password"
    );
    expect(screen.getByLabelText("Keep me signed in")).not.toBeChecked();
    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute(
      "href",
      "/forgot-password"
    );
    expect(screen.getByRole("button", { name: "Show password" })).toHaveAttribute("type", "button");
  });

  it("signs in with 'keep me signed in' and routes by the stored user", async () => {
    const user = userEvent.setup();
    const login = jest.fn(async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ role: "school_admin", onboardingCompleted: true })
      );
      return true;
    });
    renderWithAuth(<SignIn />, { login });
    await user.type(screen.getByLabelText("Email address"), "sade@school.test");
    await user.type(screen.getByLabelText("Password", { selector: "input" }), "Secret#2026");
    await user.click(screen.getByLabelText("Keep me signed in"));
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() =>
      expect(login).toHaveBeenCalledWith("sade@school.test", "Secret#2026", true)
    );
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard"));
  });

  it("a temporary password goes to set-password first", async () => {
    const user = userEvent.setup();
    const login = jest.fn(async () => {
      sessionStorage.setItem(
        "user",
        JSON.stringify({ role: "school_sub_admin", mustChangePassword: true })
      );
      return true;
    });
    renderWithAuth(<SignIn />, { login });
    await user.type(screen.getByLabelText("Email address"), "nia@school.test");
    await user.type(screen.getByLabelText("Password", { selector: "input" }), "Temp#1");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/set-password"));
  });

  it.each([
    ["Access denied: you are registered as a teacher.", /Access denied/, "danger"],
    ["Incorrect email or password", /Incorrect email or password\. Please double-check/, "warning"],
    ["Server exploded", /Server exploded/, "neutral"],
  ])("explains a refusal: %s", async (message, shown) => {
    const user = userEvent.setup();
    const login = jest.fn().mockRejectedValue(new Error(message));
    renderWithAuth(<SignIn />, { login });
    await user.type(screen.getByLabelText("Email address"), "x@school.test");
    await user.type(screen.getByLabelText("Password", { selector: "input" }), "nope");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(shown);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("classifyLoginError sorts the three kinds", () => {
    expect(classifyLoginError(new Error("Access denied"))).toEqual({
      kind: "access_denied",
      message: "Access denied",
    });
    expect(classifyLoginError(new Error("Invalid credentials"))).toEqual({
      kind: "invalid_credentials",
    });
    expect(classifyLoginError("weird")).toMatchObject({ kind: "unknown" });
  });
});

describe("set-password", () => {
  it("keeps its fields and its submit button inside the main landmark", () => {
    renderWithAuth(<SetPasswordPage />, {
      user: { ...mockAdmin, firstName: "Nia", mustChangePassword: true },
    });
    const main = screen.getByRole("main");
    expect(screen.getByRole("heading", { level: 1, name: "Set your password" })).toBeTruthy();
    expect(main.querySelector("#currentPassword")).toBeTruthy();
    expect(main.querySelector("#newPassword")).toBeTruthy();
    expect(main.querySelector("#confirmPassword")).toBeTruthy();
    const submit = main.querySelector('button[type="submit"]');
    expect(submit).toHaveTextContent("Set password and continue");
    expect(submit).toBeDisabled();
    expect(screen.getByText("Admin")).toBeTruthy();
  });

  it("says when the passwords differ", async () => {
    const user = userEvent.setup();
    renderWithAuth(<SetPasswordPage />, { user: { ...mockAdmin, mustChangePassword: true } });
    await user.type(screen.getByLabelText("New password"), "Sturdy#Pass2026");
    await user.type(screen.getByLabelText("Confirm new password"), "Different#1");
    expect(screen.getByText("Passwords do not match")).toBeTruthy();
  });
});

describe("forgot-password", () => {
  it("opens on the email step in the sign-in look", () => {
    renderWithAuth(<ForgotPassword />, {});
    expect(screen.getByRole("main")).toBeTruthy();
    expect(screen.getByLabelText("Email Address")).toHaveAttribute("id", "email");
    expect(screen.getByRole("button", { name: "Send OTP" })).toHaveAttribute("type", "submit");
    expect(screen.getByRole("img", { name: "Step 1 of 3" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Sign In" })).toHaveAttribute("href", "/");
  });
});
