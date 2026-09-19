import { resolvePostLoginRoute } from "@/lib/postLoginRoute";

describe("resolvePostLoginRoute", () => {
  const admin = { role: "school_admin", firstName: "Sade", lastName: "Principal", schoolId: "s1" };

  it("sends a temporary password to set-password before anything else", () => {
    expect(resolvePostLoginRoute({ ...admin, mustChangePassword: true, onboardingCompleted: true })).toBe(
      "/set-password",
    );
  });

  it("opens the dashboard for an onboarded admin", () => {
    expect(resolvePostLoginRoute({ ...admin, onboardingCompleted: true })).toBe("/dashboard");
  });

  it("resumes school setup for a school admin who has not finished it", () => {
    expect(resolvePostLoginRoute({ ...admin, onboardingCompleted: false })).toBe("/onboarding/setup");
  });

  it("never sends a sub-admin into school setup", () => {
    expect(
      resolvePostLoginRoute({ ...admin, role: "school_sub_admin", onboardingCompleted: false }),
    ).toBe("/dashboard");
  });

  it("still makes a sub-admin on a temporary password set it first", () => {
    expect(resolvePostLoginRoute({ ...admin, role: "school_sub_admin", mustChangePassword: true })).toBe(
      "/set-password",
    );
  });
});
