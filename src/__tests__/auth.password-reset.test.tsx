/** @jest-environment jsdom */
import { act, renderHook, waitFor } from "@testing-library/react";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const toastError = jest.fn();
const toastSuccess = jest.fn();
jest.mock("@/components/CustomToast", () => ({
  useToast: () => ({ toast: { error: toastError, success: toastSuccess } }),
}));

jest.mock("@/app/services/auth.service", () => ({
  authService: {
    forgotPassword: jest.fn(),
    verifyResetCode: jest.fn(),
    resetPassword: jest.fn(),
  },
}));
import { authService } from "@/app/services/auth.service";
const forgotPassword = authService.forgotPassword as jest.Mock;
const verifyResetCode = authService.verifyResetCode as jest.Mock;
const resetPassword = authService.resetPassword as jest.Mock;

import { usePasswordReset } from "@/app/forgot-password/usePasswordReset";

beforeEach(() => {
  jest.clearAllMocks();
  forgotPassword.mockResolvedValue({ message: "sent" });
  verifyResetCode.mockResolvedValue({ valid: true });
  resetPassword.mockResolvedValue({ message: "done" });
});

/** Walks the flow as far as the code step, with the email filled in. */
async function atCodeStep() {
  const { result } = renderHook(() => usePasswordReset());
  act(() => result.current.setEmail("admin@talim.test"));
  await act(async () => {
    await result.current.requestCode();
  });
  return result;
}

describe("usePasswordReset", () => {
  it("does not reveal whether the email has an account", async () => {
    const result = await atCodeStep();
    expect(forgotPassword).toHaveBeenCalledWith("admin@talim.test");
    expect(toastSuccess).toHaveBeenCalledWith(
      expect.stringMatching(/if that email has an account/i)
    );
    expect(result.current.step).toBe("otp");
  });

  it("keeps the code to six digits and drops anything else", async () => {
    const result = await atCodeStep();
    act(() => result.current.setOtp("12a34b5678"));
    expect(result.current.otp).toBe("123456");
  });

  it("verifies the code with the server before asking for a password", async () => {
    const result = await atCodeStep();
    act(() => result.current.setOtp("123456"));
    await act(async () => {
      await result.current.verifyCode();
    });
    expect(verifyResetCode).toHaveBeenCalledWith("admin@talim.test", "123456");
    expect(result.current.step).toBe("newPassword");
  });

  it("refuses a short code without calling the server", async () => {
    const result = await atCodeStep();
    act(() => result.current.setOtp("123"));
    await act(async () => {
      await result.current.verifyCode();
    });
    expect(verifyResetCode).not.toHaveBeenCalled();
    expect(result.current.step).toBe("otp");
  });

  it("stays on the code step when the server rejects the code", async () => {
    verifyResetCode.mockRejectedValue(new Error("expired"));
    const result = await atCodeStep();
    act(() => result.current.setOtp("123456"));
    await act(async () => {
      await result.current.verifyCode();
    });
    expect(result.current.step).toBe("otp");
    expect(toastError).toHaveBeenCalled();
  });

  it("treats a 200 carrying valid:false as a rejection", async () => {
    verifyResetCode.mockResolvedValue({ valid: false, message: "Code expired" });
    const result = await atCodeStep();
    act(() => result.current.setOtp("123456"));
    await act(async () => {
      await result.current.verifyCode();
    });
    expect(result.current.step).toBe("otp");
    expect(toastError).toHaveBeenCalledWith("Code expired");
  });

  it("resends without moving off the code step", async () => {
    const result = await atCodeStep();
    await act(async () => {
      await result.current.resendCode();
    });
    expect(forgotPassword).toHaveBeenCalledTimes(2);
    expect(result.current.step).toBe("otp");
  });

  it("rejects a weak password and a mismatch before calling the server", async () => {
    const result = await atCodeStep();
    act(() => result.current.setOtp("123456"));
    await act(async () => {
      await result.current.verifyCode();
    });

    await act(async () => {
      await result.current.resetPassword("weak", "weak");
    });
    expect(resetPassword).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.resetPassword("Str0ng!Passw0rd", "Different1!");
    });
    expect(resetPassword).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith("Passwords do not match");
  });

  it("sends the email and the verified code with the new password", async () => {
    const result = await atCodeStep();
    act(() => result.current.setOtp("123456"));
    await act(async () => {
      await result.current.verifyCode();
    });
    await act(async () => {
      await result.current.resetPassword("Str0ng!Passw0rd", "Str0ng!Passw0rd");
    });

    expect(resetPassword).toHaveBeenCalledWith(
      "admin@talim.test",
      "123456",
      "Str0ng!Passw0rd"
    );
    await waitFor(() => expect(result.current.succeeded).toBe(true));
  });
});
