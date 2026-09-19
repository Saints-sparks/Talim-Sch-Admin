import { test, expect, type Allowed } from "./support/fixtures";
import { authFile } from "./support/creds";
import { throwawayEmail } from "./support/api";
import { dismissGuide } from "./support/ui";

/**
 * Real write flows through the UI, against the real API: what the admin
 * submits is asserted on the wire, then the result is looked up in the list.
 * Records are named "E2E ..." / e2e.new.* so `node e2e/seed.js --reset` removes them.
 */
const ALLOW: readonly Allowed[] = [
  { kind: "external", match: /fonts\.googleapis\.com|fonts\.gstatic\.com/, reason: "Google Fonts; blocked by the harness" },
  { kind: "http", match: /GET \/timetable\?page=1&limit=1 -> 404/, reason: "known: onboarding probe for a route the API does not have" },
  {
    kind: "pageerror",
    match: /^: Event$/,
    reason:
      "UNATTRIBUTED (open): an uncaught rejection carrying a bare DOM Event, seen intermittently on page.reload() under `next dev` (probably the dev server's HMR socket closing). Matched exactly so any real Error still fails.",
  },
  {
    kind: "http",
    match: /GET \/teachers\/[a-f0-9]+ -> 404/,
    reason: "the wizard asks whether the new login already has a teacher profile; 'no' is a 404 by the API's design (an empty result would not be noise)",
  },
];

test.use({ storageState: authFile("schoolAdmin") });

test("admin creates a class and sees it in the list, also after a reload", async ({ page, monitor }) => {
  const name = `E2E Grade 7C ${Date.now().toString(36).slice(-4)}`;
  await page.goto("/classes");
  await expect(page.getByText("Grade 5A").first()).toBeVisible();
  await dismissGuide(page);
  monitor.clear();

  await page.getByRole("button", { name: /Add Class/i }).click();
  const dialog = page.getByRole("dialog", { name: /Create new class/i }).or(page.locator('[aria-label="Create new class"]'));
  await expect(dialog).toBeVisible();
  await page.locator("#class-name").fill(name);
  await page.locator("#class-grade").selectOption({ index: 1 });
  await page.locator("#class-capacity").selectOption({ index: 1 });
  await page.locator("#class-description").fill("Created by the browser suite");

  const created = page.waitForResponse((r) => r.url().endsWith("/classes") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Create Class" }).click();
  const res = await created;
  expect(res.status()).toBe(201);
  const payload = res.request().postDataJSON() as Record<string, unknown>;
  // Exactly the DTO: the API rejects any other field.
  expect(Object.keys(payload).sort()).toEqual(["classCapacity", "classDescription", "gradeLevel", "name"]);

  await expect(dialog).toBeHidden();
  await expect(page.getByText(name).first()).toBeVisible();
  await page.reload();
  await dismissGuide(page, 2_000);
  await expect(page.getByText(name).first()).toBeVisible();
  expect(monitor.unexpected(ALLOW)).toEqual([]);
});

test("admin adds a teacher through the modal: no password is sent, and the teacher appears", async ({ page, monitor }) => {
  const email = throwawayEmail("teacher");
  await page.goto("/users/teachers");
  await expect(page.getByText("Tolu Teacher").first()).toBeVisible();
  await dismissGuide(page);
  monitor.clear();

  const sent: Array<{ method: string; url: string; body: string }> = [];
  page.on("request", (req) => {
    if (req.method() === "POST" && /\/(auth\/register|teachers\/[a-f0-9]+)$/.test(req.url())) {
      sent.push({ method: req.method(), url: req.url(), body: req.postData() ?? "" });
    }
  });

  await page.getByRole("button", { name: /Add Teacher/i }).click();
  // Step 1: account.
  await page.locator("#teacher-email").fill(email);
  await page.locator("#teacher-first-name").fill("Nora");
  await page.locator("#teacher-last-name").fill("Newteacher");
  await page.locator("#teacher-phone").fill("+2348011112222");
  await page.locator("#teacher-dob").fill("1990-04-12");
  await page.locator("#teacher-gender").selectOption("female");
  await page.getByRole("button", { name: /^Continue/ }).click();
  // Step 2: qualifications.
  await page.locator("#teacher-qualification").selectOption({ index: 1 });
  await page.locator("#teacher-experience").selectOption({ index: 3 });
  await page.locator("#teacher-specialization").fill("Physics");
  await page.getByRole("button", { name: /^Continue/ }).click();
  // Step 3: employment, availability, classes.
  await page.locator("#teacher-employment-type").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Mon", exact: true }).click();
  await page.getByRole("button", { name: "Tue", exact: true }).click();
  await page.getByRole("button", { name: "8:00 AM - 2:00 PM" }).click();
  await page.getByRole("button", { name: /Create Teacher/ }).click();

  // The list can show the new login a moment before the profile call finishes; the wizard closing means both are done.
  await expect(page.getByText("Add New Teacher")).toBeHidden({ timeout: 30_000 });
  await expect(page.getByText("Nora Newteacher").first()).toBeVisible();

  const register = sent.find((r) => r.url.endsWith("/auth/register"));
  expect(register, "the account is registered first").toBeTruthy();
  const account = JSON.parse(register!.body) as Record<string, unknown>;
  expect(account).not.toHaveProperty("password");
  expect(account).toMatchObject({ email, role: "teacher", firstName: "Nora", lastName: "Newteacher" });
  const profile = sent.find((r) => /\/teachers\/[a-f0-9]+$/.test(r.url));
  expect(profile, `then the profile; saw ${JSON.stringify(sent.map((r) => r.method + " " + r.url))}`).toBeTruthy();
  expect(JSON.parse(profile!.body)).not.toHaveProperty("password");
  expect(monitor.unexpected(ALLOW)).toEqual([]);

  await page.reload();
  await expect(page.getByText("Nora Newteacher").first()).toBeVisible();
});
