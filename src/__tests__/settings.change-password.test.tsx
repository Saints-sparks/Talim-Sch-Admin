/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthContext } from "@/context/AuthContext";
import { ChangePasswordModal } from "@/components/settings/ChangePasswordModal";

const changePassword = jest.fn().mockResolvedValue(undefined);

/** The modal only needs the auth context; nothing else in it is used. */
function renderModal(onClose = jest.fn()) {
  const value = { changePassword } as unknown as React.ContextType<typeof AuthContext>;
  render(
    <AuthContext.Provider value={value}>
      <ChangePasswordModal onClose={onClose} />
    </AuthContext.Provider>
  );
  return { onClose };
}

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(new RegExp(label, "i"), { selector: "input" }), {
    target: { value },
  });
}

beforeEach(() => jest.clearAllMocks());

describe("ChangePasswordModal", () => {
  it("refuses a password that breaks the shared policy", () => {
    renderModal();
    fill("Current Password", "old-password");
    fill("^New Password", "weakpass");
    fill("Confirm New Password", "weakpass");
    expect(screen.getByRole("button", { name: /update password/i })).toHaveProperty("disabled", true);
  });

  it("refuses a mismatched confirmation and says so", () => {
    renderModal();
    fill("Current Password", "old-password");
    fill("^New Password", "Str0ng!Pass");
    fill("Confirm New Password", "Str0ng!Pas");
    expect(screen.getByText(/do not match/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /update password/i })).toHaveProperty("disabled", true);
  });

  it("changes the password through the auth context, which adopts the rotated token", async () => {
    const { onClose } = renderModal();
    fill("Current Password", "old-password");
    fill("^New Password", "Str0ng!Pass");
    fill("Confirm New Password", "Str0ng!Pass");
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => expect(changePassword).toHaveBeenCalledWith("old-password", "Str0ng!Pass", "Str0ng!Pass"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("restores page scroll when it closes", () => {
    const { unmount } = render(
      <AuthContext.Provider value={{ changePassword } as unknown as React.ContextType<typeof AuthContext>}>
        <ChangePasswordModal onClose={jest.fn()} />
      </AuthContext.Provider>
    );
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});
