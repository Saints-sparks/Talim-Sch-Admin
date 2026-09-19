import { test, expect, type Allowed } from "./support/fixtures";
import { ACCOUNTS, authFile } from "./support/creds";
import { apiCall, apiLogin, throwawayEmail } from "./support/api";
import { signInThroughUi } from "./support/auth";

const FONTS: Allowed = {
  kind: "external",
  match: /fonts\.googleapis\.com|fonts\.gstatic\.com/,
  reason: "Google Fonts stylesheet; blocked by the harness, the page falls back to a system font.",
};

test.describe("school admin sign-in", () => {
  test("a wrong password shows a clear message and stays on the sign-in page", async ({ page, monitor }) => {
    await page.goto("/");
    await page.getByLabel("Email address").fill(ACCOUNTS.schoolAdmin.email);
    await page.getByLabel("Password", { exact: true }).fill("Not-The-Password-1!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText(/Incorrect email or password/i)).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
    // The one expected failure is the 401 from the API; nothing else may go wrong.
    const allow: Allowed[] = [
      FONTS,
      { kind: "http", match: /POST \/auth\/login -> 401/, reason: "the wrong password is refused" },
      { kind: "http", match: /POST \/auth\/refresh -> 401/, reason: "the sign-in page probes for an existing session cookie; there is none" },
    ];
    expect(monitor.unexpected(allow)).toEqual([]);
  });

  test("the right password lands on the dashboard", async ({ page }) => {
    await signInThroughUi(page, ACCOUNTS.schoolAdmin);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/Good (morning|afternoon|evening), Sade/)).toBeVisible();
  });

  test("a teacher is refused by the admin portal with an explanation", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Email address").fill(ACCOUNTS.teacher.email);
    await page.getByLabel("Password", { exact: true }).fill(ACCOUNTS.teacher.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText(/Access denied/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe("sub-admin access", () => {
  test.use({ storageState: authFile("subAdmin") });

  test("only the pages the sub-admin's permissions allow appear in the sidebar", async ({ page }) => {
    await page.goto("/dashboard");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.locator('a[href="/dashboard"]')).toBeVisible();
    await expect(nav.locator('a[href="/announcements"]')).toBeVisible();
    // The Users group opens to Students only (manage:students); Teachers, Parents and Sub-Admins are hidden.
    await nav.getByText("Users", { exact: true }).click();
    await expect(nav.locator('a[href="/users/students"]')).toBeVisible();
    for (const hidden of [
      "/classes",
      "/curriculum",
      "/assessments",
      "/timetable",
      "/fees-management",
      "/payments",
      "/finance",
      "/leave-requests",
      "/transit",
      "/messages",
      "/settings",
      "/users/teachers",
      "/users/parents",
      "/users/sub-admins",
    ]) {
      await expect(nav.locator(`a[href="${hidden}"]`), `${hidden} must not be offered`).toHaveCount(0);
    }
  });

  for (const path of ["/fees-management", "/classes", "/finance", "/users/teachers", "/users/sub-admins"]) {
    test(`opening ${path} directly is refused`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: "Access Denied" })).toBeVisible();
      await expect(page.getByText(/don't have permission/i)).toBeVisible();
    });
  }

  test("a permitted page still works", async ({ page }) => {
    await page.goto("/users/students");
    await expect(page.getByText("Ada Student").first()).toBeVisible();
  });
});

test.describe.serial("temporary password", () => {
  const newPassword = "Sturdy#Pass2026";
  let email = "";
  let temporaryPassword = "";

  test("a new sub-admin is forced to set a password, then can use the app", async ({ page, monitor }) => {
    // KNOWN BACKEND BUG (open): POST /auth/change-password returns an access token with no
    // sub/email/role (it spreads a Mongoose document), so POST /auth/introspect says
    // { active: false } and the app shows "Token introspection failed" instead of the dashboard.
    // Remove this line when the backend is fixed; Playwright then reports an unexpected pass.
    test.fail(true, "backend: change-password returns an unusable token");

    // Create the account the way the product does: the school admin adds a sub-admin.
    const adminToken = await apiLogin(ACCOUNTS.schoolAdmin);
    email = throwawayEmail("subadmin");
    const created = await apiCall<{ temporaryPassword: string }>(adminToken, "POST", "/sub-admins", {
      firstName: "Nia",
      lastName: "Newcomer",
      email,
      phoneNumber: "+2348000009999",
      permissions: ["manage:announcements"],
    });
    temporaryPassword = created.temporaryPassword;
    expect(temporaryPassword).toBeTruthy();

    await page.goto("/");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(temporaryPassword);
    await page.getByRole("button", { name: "Sign in" }).click();

    // The API refuses everything else until the password is replaced, so the app must go straight there.
    await expect(page).toHaveURL(/\/set-password/);
    monitor.clear();

    await page.locator("#currentPassword").fill(temporaryPassword);
    await page.locator("#newPassword").fill(newPassword);
    await page.locator("#confirmPassword").fill(newPassword);
    await page.locator('main button[type="submit"]').click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await expect(page.locator('a[href="/announcements"]').first()).toBeVisible();
    expect(monitor.unexpected([FONTS])).toEqual([]);
  });

  test("after the change, the new password signs in normally and the temporary one is dead", async ({ page }) => {
    expect(await apiLogin({ email, password: newPassword })).toBeTruthy();
    await expect(apiLogin({ email, password: temporaryPassword })).rejects.toThrow();

    await signInThroughUi(page, { email, password: newPassword, name: "Nia Newcomer" });
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('a[href="/announcements"]').first()).toBeVisible();
  });
});
