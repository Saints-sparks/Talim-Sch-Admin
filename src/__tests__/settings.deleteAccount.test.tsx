/** @jest-environment jsdom */
/**
 * Delete account (v1.5): the danger zone card and its sheet, the sign-in
 * notices, the legal links, and the auth context's part (the cancelled toast,
 * a sign-out that makes no more server calls, the query cache emptied).
 */
import React from "react";
import { act, fireEvent, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SignIn from "@/app/page";
import { AuthContext, AuthProvider, useAuth } from "@/context/AuthContext";
import { DeleteAccountCard } from "@/components/settings/DeleteAccountCard";
import { DataSystemSection } from "@/components/settings/DataSystemSection";
import { SignInFooter } from "@/components/auth/signin-ui";
import { authService } from "@/app/services/auth.service";
import { dropLocalWebPush } from "@/app/hooks/usePushNotifications";
import { toast } from "@/components/CustomToast";
import { ApiError } from "@/lib/apiError";
import { sessionStore } from "@/lib/session";
import { clearQueriesOnLogout } from "@/providers/query-provider";
import {
  DELETION_CANCELLED_MESSAGE,
  deletionFailure,
  deletionNoticeFromSearch,
  deletionScheduledRoute,
} from "@/lib/authPolicy";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <span data-alt={alt} />,
}));
jest.mock("@/components/ModernLoader", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/CustomToast", () => {
  const toast = { success: jest.fn(), error: jest.fn(), info: jest.fn(), warning: jest.fn() };
  return { toast, useToast: () => ({ toast, toasts: [], removeToast: jest.fn() }) };
});
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("@/app/services/auth.service", () => ({
  authService: {
    requestAccountDeletion: jest.fn(),
    login: jest.fn(),
    introspectToken: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    changePassword: jest.fn(),
  },
}));
jest.mock("@/app/hooks/usePushNotifications", () => ({
  revokeWebPushOnSignOut: jest.fn().mockResolvedValue(undefined),
  dropLocalWebPush: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/apiClient", () => ({ apiClient: { setAccessToken: jest.fn(), initialize: jest.fn() } }));
jest.mock("@/hooks/usePermissions", () => ({ usePermissions: () => ({ hasPermission: () => false }) }));
jest.mock("@/hooks/settings/useDataExport", () => ({ useDataExport: () => ({ exporting: null, run: jest.fn() }) }));

const auth = authService as jest.Mocked<typeof authService>;
const SCHEDULED = {
  status: "scheduled" as const,
  requestedAt: "2026-10-09T10:00:00.000Z",
  scheduledFor: "2026-11-08T10:00:00.000Z",
};
const ROUTE = "/?deletionScheduledFor=2026-11-08T10%3A00%3A00.000Z";

/**
 * Renders the card under a stub auth context and a fresh query client.
 *
 * @param logout - The context's `logout`.
 * @returns The render result.
 */
function renderCard(logout = jest.fn().mockResolvedValue(undefined)) {
  const value = { logout } as unknown as React.ContextType<typeof AuthContext>;
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={value}>
        <DeleteAccountCard />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

/**
 * Opens the sheet from the card.
 *
 * @returns The dialog.
 */
async function openSheet(): Promise<HTMLElement> {
  fireEvent.click(screen.getByRole("button", { name: "Delete account" }));
  return screen.findByRole("dialog", { name: "Delete your account?" });
}

/**
 * Types a password and ticks the box.
 *
 * @param dialog - The open sheet.
 * @param password - What to type.
 */
function complete(dialog: HTMLElement, password = "Correct#Pass1") {
  fireEvent.change(within(dialog).getByLabelText("Password", { selector: "input" }), {
    target: { value: password },
  });
  fireEvent.click(within(dialog).getByRole("checkbox", { name: /I understand/ }));
}

/**
 * The parts of a failed `Response` that `ApiError.fromResponse` reads.
 *
 * @param status - HTTP status.
 * @returns A stand-in response.
 */
const fakeResponse = (status: number) => ({ status, headers: { get: () => null } }) as unknown as Response;

/**
 * A refusal with a top-level route code, as the API client throws it.
 *
 * @param status - HTTP status.
 * @param code - The route's `code`.
 * @param message - The server's message.
 * @returns The error.
 */
function refusal(status: number, code: string, message: string): ApiError {
  return ApiError.fromResponse(fakeResponse(status), {
    success: false,
    code,
    error: { code: status === 403 ? "FORBIDDEN" : "CONFLICT", message },
  } as never);
}

beforeEach(() => {
  jest.clearAllMocks();
  window.history.replaceState({}, "", "/");
});

describe("Danger zone → Delete account", () => {
  it("explains the 30 days, what is erased and kept, and links the full explanation", () => {
    renderCard();
    const zone = screen.getByRole("region", { name: "Danger zone" });
    expect(zone).toHaveTextContent("deleted in 30 days");
    expect(zone).toHaveTextContent("signing in before then cancels it");
    expect(zone).toHaveTextContent("name, email, phone number and photo are erased");
    expect(zone).toHaveTextContent("Your school keeps grades, attendance and payments");
    expect(within(zone).getByRole("link", { name: /What happens when you delete your account/ })).toHaveAttribute(
      "href",
      "https://www.mytalim.com/delete-account"
    );
  });

  it("keeps Delete disabled until a password is typed and the box is ticked", async () => {
    renderCard();
    const dialog = await openSheet();
    const confirm = within(dialog).getByRole("button", { name: "Delete account" });
    expect(confirm).toBeDisabled();
    const password = within(dialog).getByLabelText("Password", { selector: "input" });
    fireEvent.change(password, { target: { value: "pw" } });
    expect(confirm).toBeDisabled();
    fireEvent.click(within(dialog).getByRole("checkbox", { name: /I understand/ }));
    expect(confirm).toBeEnabled();

    expect(password).toHaveAttribute("type", "password");
    fireEvent.click(within(dialog).getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    expect(auth.requestAccountDeletion).not.toHaveBeenCalled();
  });

  it("on 200 signs out through logout and goes to sign-in with the date", async () => {
    auth.requestAccountDeletion.mockResolvedValueOnce(SCHEDULED);
    const logout = jest.fn().mockResolvedValue(undefined);
    renderCard(logout);
    const dialog = await openSheet();
    complete(dialog);
    fireEvent.change(within(dialog).getByLabelText(/Why are you leaving/), { target: { value: " Retiring " } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete account" }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(ROUTE));
    expect(logout).toHaveBeenCalledWith({ redirectTo: ROUTE, sessionEnded: true });
    expect(auth.requestAccountDeletion).toHaveBeenCalledWith({ password: "Correct#Pass1", reason: "Retiring" });
  });

  it("shows a wrong password (400, field error on password) on the field", async () => {
    auth.requestAccountDeletion.mockRejectedValueOnce(
      ApiError.fromResponse(fakeResponse(400), {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Your password is incorrect.",
          details: [{ field: "password", reason: "Password is incorrect" }],
        },
      } as never)
    );
    const logout = jest.fn();
    renderCard(logout);
    const dialog = await openSheet();
    complete(dialog, "wrong");
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete account" }));

    const field = within(dialog).getByLabelText("Password", { selector: "input" });
    await waitFor(() => expect(field).toHaveAttribute("aria-invalid", "true"));
    expect(field).toHaveAccessibleDescription("Password is incorrect");
    expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();
  });

  it("shows LAST_SCHOOL_ADMIN's message with a link to Help & support", async () => {
    const message = "You are the only admin of your school. Make another admin first or contact Talim support.";
    auth.requestAccountDeletion.mockRejectedValueOnce(refusal(409, "LAST_SCHOOL_ADMIN", message));
    renderCard();
    const dialog = await openSheet();
    complete(dialog);
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete account" }));

    const alert = await within(dialog).findByRole("alert");
    expect(alert).toHaveTextContent(message);
    expect(within(alert).getByRole("link", { name: /Contact Talim support/ })).toHaveAttribute("href", "/help");
  });

  it("shows other refusals in the banner without the support link", () => {
    expect(deletionFailure(refusal(403, "ADMIN_ACCOUNT", ""))).toEqual({
      field: null,
      banner: expect.stringMatching(/./),
      code: "ADMIN_ACCOUNT",
    });
    expect(deletionFailure(new Error("boom")).banner).toBe("boom");
  });
});

describe("sign-in and the legal links", () => {
  /**
   * Renders the sign-in page with a stub auth context.
   *
   * @returns The render result.
   */
  const renderSignIn = () =>
    render(
      <AuthContext.Provider value={{ login: jest.fn() } as unknown as React.ContextType<typeof AuthContext>}>
        <SignIn />
      </AuthContext.Provider>
    );

  it("says when the account will be deleted after a deletion request", async () => {
    window.history.replaceState({}, "", deletionScheduledRoute(SCHEDULED.scheduledFor));
    renderSignIn();
    expect(
      await screen.findByText("Your account will be deleted on 8 November 2026. Sign in before then to cancel.")
    ).toBeInTheDocument();
    expect(deletionNoticeFromSearch("?deletionScheduledFor=nope")).toBeNull();
  });

  it("shows no notice on a plain sign-in", () => {
    renderSignIn();
    expect(screen.queryByText(/Account deletion scheduled/)).not.toBeInTheDocument();
  });

  it("links Privacy, Terms and Support in the sign-in footer and in Data & System", () => {
    render(<SignInFooter supportEmail="support@mytalim.com" year={2026} />);
    const nav = screen.getByRole("navigation", { name: "Talim policies and support" });
    expect(within(nav).getByRole("link", { name: /Privacy/ })).toHaveAttribute("href", "https://www.mytalim.com/privacy");
    expect(within(nav).getByRole("link", { name: /Terms/ })).toHaveAttribute("href", "https://www.mytalim.com/terms");
    expect(within(nav).getByRole("link", { name: /Support/ })).toHaveAttribute("href", "https://www.mytalim.com/support");

    render(<DataSystemSection />);
    expect(screen.getByRole("link", { name: /Privacy policy/ })).toHaveAttribute("href", "https://www.mytalim.com/privacy");
    expect(screen.getByRole("link", { name: /Terms of service/ })).toHaveAttribute("href", "https://www.mytalim.com/terms");
  });
});

describe("AuthContext and the deletion", () => {
  const ADMIN = { userId: "u1", email: "admin@school.edu", role: "school_admin", schoolId: "665f1c2a9b1e8a0012345678" };

  /**
   * Mounts the provider and waits for start-up.
   *
   * @returns The hook result.
   */
  async function mount() {
    const hook = renderHook(() => useAuth(), {
      wrapper: ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>,
    });
    await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
    return hook;
  }

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    sessionStore.set(null, null);
    auth.refresh.mockRejectedValue(new ApiError("UNAUTHENTICATED", "no session", 401));
    auth.introspectToken.mockResolvedValue({ active: true, user: ADMIN } as never);
  });

  it("toasts the cancelled notice when login answers deletionCancelled: true", async () => {
    auth.login.mockResolvedValue({ access_token: "tok", deletionCancelled: true } as never);
    const { result } = await mount();
    await act(async () => {
      await result.current.login("admin@school.edu", "pw");
    });
    expect(toast.success).toHaveBeenCalledWith(DELETION_CANCELLED_MESSAGE);
    expect(DELETION_CANCELLED_MESSAGE).toBe("Welcome back. Your account deletion has been cancelled.");
  });

  it("does not toast it on an ordinary sign-in", async () => {
    auth.login.mockResolvedValue({ access_token: "tok" } as never);
    const { result } = await mount();
    await act(async () => {
      await result.current.login("admin@school.edu", "pw");
    });
    expect(toast.success).not.toHaveBeenCalledWith(DELETION_CANCELLED_MESSAGE);
  });

  it("signs out after a deletion without server calls, carrying the route, and empties the query cache", async () => {
    localStorage.setItem("accessToken", "stored-token");
    const client = new QueryClient();
    client.setQueryData(["settings", "adminProfile"], { firstName: "Sade" });
    const stop = clearQueriesOnLogout(client);
    const events: Array<{ type?: string; redirectTo?: string }> = [];
    const listen = (e: Event) => events.push((e as CustomEvent).detail);
    window.addEventListener("auth-changed", listen);
    const { result } = await mount();
    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout({ redirectTo: ROUTE, sessionEnded: true });
    });

    expect(auth.logout).not.toHaveBeenCalled();
    expect(dropLocalWebPush).toHaveBeenCalled();
    expect(events).toContainEqual({ type: "logout", redirectTo: ROUTE });
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(toast.success).not.toHaveBeenCalledWith("Logged out successfully");
    expect(client.getQueryData(["settings", "adminProfile"])).toBeUndefined();
    window.removeEventListener("auth-changed", listen);
    stop();
  });
});
