/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "@/context/AuthContext";
import { ChangePasswordModal } from "@/components/settings/ChangePasswordModal";
import {
  DEFAULT_PASSWORD_POLICY,
  isPasswordValid,
  normalizePasswordPolicy,
  passwordHistoryNote,
  rulesFromPolicy,
} from "@/lib/passwordPolicy";
import type { PasswordPolicy } from "@/types/round4Contract";

const changePassword = jest.fn().mockResolvedValue(undefined);
const getPasswordPolicy = jest.fn();

jest.mock("@/app/services/auth.service", () => ({
  authService: { getPasswordPolicy: () => getPasswordPolicy() },
}));

/** The modal needs the auth context, and a query client for the password policy. */
function renderModal(onClose = jest.fn()) {
  const value = { changePassword } as unknown as React.ContextType<typeof AuthContext>;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const utils = render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={value}>
        <ChangePasswordModal onClose={onClose} />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
  return { onClose, ...utils };
}

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(new RegExp(label, "i"), { selector: "input" }), {
    target: { value },
  });
}

const submit = () => screen.getByRole("button", { name: /update password/i });

beforeEach(() => {
  jest.clearAllMocks();
  getPasswordPolicy.mockResolvedValue(DEFAULT_PASSWORD_POLICY);
});

describe("ChangePasswordModal", () => {
  it("refuses a password that breaks the shared policy", () => {
    renderModal();
    fill("Current Password", "old-password");
    fill("^New Password", "weakpass");
    fill("Confirm New Password", "weakpass");
    expect(submit()).toHaveProperty("disabled", true);
  });

  it("refuses a mismatched confirmation and says so", () => {
    renderModal();
    fill("Current Password", "old-password");
    fill("^New Password", "Str0ng!Pass");
    fill("Confirm New Password", "Str0ng!Pas");
    expect(screen.getByText(/do not match/i)).toBeTruthy();
    expect(submit()).toHaveProperty("disabled", true);
  });

  it("changes the password through the auth context, which adopts the rotated token", async () => {
    const { onClose } = renderModal();
    fill("Current Password", "old-password");
    fill("^New Password", "Str0ng!Pass");
    fill("Confirm New Password", "Str0ng!Pass");
    fireEvent.click(submit());

    await waitFor(() => expect(changePassword).toHaveBeenCalledWith("old-password", "Str0ng!Pass", "Str0ng!Pass"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("restores page scroll when it closes", () => {
    const { unmount } = renderModal();
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  describe("with the server's password policy (GET /auth/password-policy)", () => {
    const strict: PasswordPolicy = {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSymbol: false,
      historyCount: 5,
    };

    it("lists the server's rules and the reuse note", async () => {
      getPasswordPolicy.mockResolvedValue(strict);
      renderModal();
      expect(await screen.findByText("At least 12 characters")).toBeInTheDocument();
      expect(screen.queryByText(/A symbol such as/)).not.toBeInTheDocument();
      expect(screen.getByText("It can't be one of your last 5 passwords.")).toBeInTheDocument();
      // The checklist describes the new-password field.
      expect(screen.getByLabelText(/^New Password/i, { selector: "input" })).toHaveAccessibleDescription(
        /At least 12 characters/
      );
    });

    it("checks what the server checks: length from the policy, no symbol needed", async () => {
      getPasswordPolicy.mockResolvedValue(strict);
      renderModal();
      await screen.findByText("At least 12 characters");
      fill("Current Password", "old-password");

      // Passes the built-in rules but is too short for this school's policy.
      fill("^New Password", "Str0ng!Pass");
      fill("Confirm New Password", "Str0ng!Pass");
      expect(submit()).toHaveProperty("disabled", true);

      // Long enough, and needs no symbol here.
      fill("^New Password", "Str0ngPassword");
      fill("Confirm New Password", "Str0ngPassword");
      expect(submit()).toHaveProperty("disabled", false);
    });

    it("falls back to the built-in rules when the policy can't be loaded", async () => {
      getPasswordPolicy.mockRejectedValue(new Error("offline"));
      renderModal();
      expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
      await waitFor(() => expect(getPasswordPolicy).toHaveBeenCalled());
      fill("Current Password", "old-password");
      fill("^New Password", "Str0ngPassword");
      fill("Confirm New Password", "Str0ngPassword");
      // The default policy wants a symbol.
      expect(submit()).toHaveProperty("disabled", true);
    });
  });
});

describe("password policy helpers", () => {
  it("fills anything missing or malformed from the default", () => {
    expect(normalizePasswordPolicy(undefined)).toEqual(DEFAULT_PASSWORD_POLICY);
    expect(normalizePasswordPolicy({ minLength: 10, requireSymbol: false, historyCount: "3" })).toEqual({
      ...DEFAULT_PASSWORD_POLICY,
      minLength: 10,
      requireSymbol: false,
    });
    expect(normalizePasswordPolicy({ minLength: 0 }).minLength).toBe(DEFAULT_PASSWORD_POLICY.minLength);
  });

  it("lists only the rules the policy asks for", () => {
    const rules = rulesFromPolicy({ ...DEFAULT_PASSWORD_POLICY, requireUppercase: false, requireSymbol: false });
    expect(rules.map((r) => r.id)).toEqual(["length", "lower", "number"]);
    expect(isPasswordValid("lowercase1", rules)).toBe(true);
    expect(isPasswordValid("lowercase1")).toBe(false);
  });

  it("uses the backend's symbol set", () => {
    const [symbol] = rulesFromPolicy().filter((r) => r.id === "symbol");
    expect(symbol.test("abc!")).toBe(true);
    expect(symbol.test("abc~")).toBe(false);
  });

  it("words the reuse note by count", () => {
    expect(passwordHistoryNote({ ...DEFAULT_PASSWORD_POLICY, historyCount: 0 })).toBeNull();
    expect(passwordHistoryNote({ ...DEFAULT_PASSWORD_POLICY, historyCount: 1 })).toBe("It can't be your current password.");
    expect(passwordHistoryNote()).toBe("It can't be one of your last 3 passwords.");
  });
});
