import fs from "node:fs";
import type { Locator, Page } from "@playwright/test";
import { test, expect } from "./support/fixtures";
import { ACCOUNTS, authFile } from "./support/creds";
import { apiCall, apiLogin } from "./support/api";
import { dismissGuide } from "./support/ui";

/**
 * The redesign's School Admin screens against the real API:
 * - Settings → School Day & Bells (`/settings?section=school-day`): a new
 *   bell schedule with periods, a break and lunch, kept after a reload, and
 *   the overlap check;
 * - Settings → School Calendar (`/settings?section=school-calendar`): a
 *   holiday and an early close, one edited and one deleted;
 * - Timetable: an entry placed with the Period picker and a Room, shown on
 *   the grid card;
 * - a sub-admin without `manage:settings` cannot reach either tab.
 *
 * This replaces the seeded bell schedule and adds a timetable entry; the
 * backend's `node e2e/seed.js` puts both back (the Teachers suite's checks
 * of the new labels run in between, see its 08-admin-bells.spec.ts).
 */
const THEME_KEY = "talim_admin_theme";

/** The schedule the admin builds: [name, starts, ends, break]. */
export const BELLS: readonly [string, string, string, boolean][] = [
  ["Morning Period 1", "08:00", "08:40", false],
  ["Morning Period 2", "08:40", "09:20", false],
  ["Short Break", "09:20", "09:40", true],
  ["Morning Period 3", "09:40", "10:20", false],
  ["Lunch", "10:20", "11:00", true],
  ["Afternoon Period", "11:00", "11:40", false],
];
const ROOM = "Lab 2";
const HOLIDAY = "E2E Staff Day";
const HOLIDAY_EDITED = "E2E Staff Training Day";
const EARLY = "E2E Sports afternoon";

test.use({ storageState: authFile("schoolAdmin") });
test.describe.configure({ mode: "serial" });

const periods = (page: Page) => page.getByRole("list", { name: "Periods" }).getByRole("listitem");

async function openSection(page: Page, section: "school-day" | "school-calendar", title: string): Promise<void> {
  await page.goto(`/settings?section=${section}`);
  await expect(page.getByRole("heading", { name: title }).first()).toBeVisible();
  await expect(page.locator(".animate-pulse:visible")).toHaveCount(0, { timeout: 30_000 });
  // The one-time guide opens once the section renders: close it after that (it is late on a busy machine).
  await dismissGuide(page, 3_000);
}

async function fillRow(row: Locator, name: string, start: string, end: string): Promise<void> {
  await row.getByLabel("Name", { exact: true }).fill(name);
  await row.getByLabel("Starts", { exact: true }).fill(start);
  await row.getByLabel("Ends", { exact: true }).fill(end);
}

test("the admin builds a bell schedule with a break and lunch, and it is kept after a reload", async ({ page }) => {
  // A known starting point, so the form is always changed (a rerun would otherwise match what is saved).
  const admin = await apiLogin(ACCOUNTS.schoolAdmin);
  await apiCall(admin, "PATCH", "/settings/academic", {
    periods: [{ key: "p1", label: "Period 1", startTime: "08:00", endTime: "08:40", isBreak: false }],
  });
  await openSection(page, "school-day", "School Day & Bells");

  // Start from an empty schedule.
  while ((await periods(page).count()) > 0) {
    await periods(page).first().getByRole("button", { name: /^Delete / }).click();
  }
  for (const [name, start, end, isBreak] of BELLS) {
    await page.getByRole("button", { name: isBreak ? "Add break" : "Add period" }).click();
    const row = periods(page).last();
    await fillRow(row, name, start, end);
    await expect(row.getByRole("checkbox", { name: "Break" })).toBeChecked({ checked: isBreak });
  }

  const saved = page.waitForResponse((r) => r.url().includes("/settings/academic") && r.request().method() === "PATCH");
  await page.getByRole("button", { name: "Save changes" }).click();
  const res = await saved;
  expect(res.status()).toBe(200);
  const sent = res.request().postDataJSON() as { periods: { label: string; startTime: string; endTime: string; isBreak: boolean }[] };
  expect(sent.periods.map((p) => [p.label, p.startTime, p.endTime, p.isBreak])).toEqual(BELLS);

  await page.reload();
  await openSection(page, "school-day", "School Day & Bells");
  await expect(periods(page)).toHaveCount(BELLS.length);
  for (const [i, [name, start, end, isBreak]] of BELLS.entries()) {
    const row = periods(page).nth(i);
    await expect(row.getByLabel("Name", { exact: true })).toHaveValue(name);
    await expect(row.getByLabel("Starts", { exact: true })).toHaveValue(start);
    await expect(row.getByLabel("Ends", { exact: true })).toHaveValue(end);
    await expect(row.getByRole("checkbox", { name: "Break" })).toBeChecked({ checked: isBreak });
  }
});

test("an overlapping period is caught before anything is sent", async ({ page }) => {
  await openSection(page, "school-day", "School Day & Bells");
  let patched = false;
  page.on("request", (r) => {
    if (r.url().includes("/settings/academic") && r.method() === "PATCH") patched = true;
  });
  const second = periods(page).nth(1);
  await second.getByLabel("Starts", { exact: true }).fill("08:20");
  // Problems are shown once the admin tries to save.
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Fix the highlighted fields before saving.")).toBeVisible();
  await expect(second.getByText("Overlaps Morning Period 1 (ends 08:40).")).toBeVisible();
  await expect(second.getByLabel("Starts", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await page.waitForTimeout(500);
  expect(patched).toBe(false);
  await page.getByRole("button", { name: "Discard changes" }).click();
  await expect(second.getByLabel("Starts", { exact: true })).toHaveValue("08:40");
});

test("the admin adds a holiday and an early close, edits one and deletes the other", async ({ page }) => {
  await openSection(page, "school-calendar", "School Calendar");
  const dialog = page.getByRole("dialog");

  const add = async (title: string, type: "holiday" | "early_close", date: string, endsAt?: string) => {
    await page.getByRole("button", { name: "Add event" }).click();
    await dialog.getByLabel(/^Title/).fill(title);
    await dialog.getByLabel(/^Type/).selectOption(type);
    await dialog.getByLabel(/^First day/).fill(date);
    if (endsAt) await dialog.getByLabel(/^School ends at/).fill(endsAt);
    const created = page.waitForResponse((r) => r.url().endsWith("/calendar-events") && r.request().method() === "POST");
    await dialog.getByRole("button", { name: "Save event" }).click();
    expect((await created).status()).toBe(201);
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  };
  await add(HOLIDAY, "holiday", "2026-11-02");
  await add(EARLY, "early_close", "2026-11-06", "13:00");

  await page.getByRole("button", { name: `Edit ${HOLIDAY}` }).click();
  await expect(dialog.getByLabel(/^Title/)).toHaveValue(HOLIDAY);
  await dialog.getByLabel(/^Title/).fill(HOLIDAY_EDITED);
  const patched = page.waitForResponse((r) => /\/calendar-events\/[a-f0-9]{24}$/.test(r.url()) && r.request().method() === "PATCH");
  await dialog.getByRole("button", { name: "Save event" }).click();
  expect((await patched).ok()).toBe(true);
  await expect(page.getByText(HOLIDAY_EDITED, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: `Delete ${EARLY}` }).click();
  const removed = page.waitForResponse((r) => /\/calendar-events\/[a-f0-9]{24}$/.test(r.url()) && r.request().method() === "DELETE");
  await page.getByRole("dialog", { name: "Delete event?" }).getByRole("button", { name: "Delete event" }).click();
  expect((await removed).ok()).toBe(true);

  await page.reload();
  await openSection(page, "school-calendar", "School Calendar");
  await expect(page.getByText(HOLIDAY_EDITED, { exact: true })).toBeVisible();
  await expect(page.getByText(EARLY, { exact: true })).toHaveCount(0);
  await expect(page.getByText(HOLIDAY, { exact: true })).toHaveCount(0);
});

test("a timetable entry placed with the Period picker and a Room shows the room on the grid", async ({ page }) => {
  // A weekday on which Tolu (the only teacher of Grade 5A) has nothing at 08:00-08:40.
  const token = await apiLogin(ACCOUNTS.teacher);
  const week = await apiCall<{ lessons: { day: string; startTime: string; endTime: string }[] }>(token, "GET", "/timetable/me");
  const day = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].find(
    (d) => !week.lessons.some((l) => l.day === d && l.startTime < "08:40" && l.endTime > "08:00"),
  );
  test.skip(!day, "Grade 5A has no weekday free at 08:00");

  await page.goto("/timetable");
  await dismissGuide(page, 2_000);
  const cls = page.locator("#timetable-class");
  await expect(cls.locator("option", { hasText: "Grade 5A" })).toHaveCount(1);
  await cls.selectOption({ label: (await cls.locator("option", { hasText: "Grade 5A" }).textContent())!.trim() });
  await expect(page.locator(".animate-pulse:visible")).toHaveCount(0, { timeout: 30_000 });
  await page.getByRole("button", { name: "Add Entry" }).click();

  const modal = page.getByRole("dialog", { name: "Add Timetable Entry" });
  const course = modal.locator("#entry-course");
  await course.selectOption({ label: (await course.locator("option", { hasText: "Mathematics 5A" }).first().textContent())!.trim() });
  await modal.locator("#entry-day").selectOption(day!);
  await modal.locator("#entry-period").selectOption({ label: "Morning Period 1 (08:00–08:40)" });
  await expect(modal.locator("#entry-start")).toHaveValue("08:00");
  await expect(modal.locator("#entry-end")).toHaveValue("08:40");
  // Breaks are not offered for lessons.
  await expect(modal.locator("#entry-period option", { hasText: "Lunch" })).toHaveCount(0);
  await modal.locator("#entry-room").fill(ROOM);
  const created = page.waitForResponse((r) => /\/timetable\/?$/.test(new URL(r.url()).pathname) && r.request().method() === "POST");
  await modal.getByRole("button", { name: "Add Entry" }).click();
  const res = await created;
  expect(res.ok()).toBe(true);
  expect(res.request().postDataJSON()).toMatchObject({ day, startTime: "08:00", endTime: "08:40", room: ROOM, periodKey: expect.any(String) });
  await expect(modal).toHaveCount(0);

  await expect(page.getByText(ROOM, { exact: true }).first()).toBeVisible();
  await page.reload();
  await dismissGuide(page, 2_000);
  const cls2 = page.locator("#timetable-class");
  await cls2.selectOption({ label: (await cls2.locator("option", { hasText: "Grade 5A" }).textContent())!.trim() });
  await expect(page.getByText(ROOM, { exact: true }).first()).toBeVisible();
  fs.writeFileSync("e2e/reports/admin-bells.json", JSON.stringify({ day, room: ROOM, periods: BELLS.map((b) => b[0]) }, null, 2));
});

test.describe("a sub-admin without manage:settings", () => {
  test.use({ storageState: authFile("subAdmin") });

  test("cannot reach School Day & Bells or School Calendar", async ({ page }) => {
    for (const section of ["school-day", "school-calendar"]) {
      await page.goto(`/settings?section=${section}`);
      await expect(page.getByRole("heading", { name: "Access Denied" })).toBeVisible();
      await expect(page.getByText("School Day & Bells")).toHaveCount(0);
      await expect(page.getByText("School Calendar")).toHaveCount(0);
    }
  });
});

test("screenshots of School Day & Bells, School Calendar and the Period picker, light and dark", async ({ browser, baseURL }) => {
  test.setTimeout(240_000);
  fs.mkdirSync("e2e/screenshots", { recursive: true });
  for (const theme of ["light", "dark"] as const) {
    const context = await browser.newContext({ baseURL, storageState: authFile("schoolAdmin"), viewport: { width: 1440, height: 900 }, colorScheme: theme });
    const page = await context.newPage();
    await page.route((url) => !["localhost", "127.0.0.1"].includes(url.hostname), (route) => route.abort());
    await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [THEME_KEY, theme] as const);

    await openSection(page, "school-day", "School Day & Bells");
    await page.waitForTimeout(600);
    await page.screenshot({ path: `e2e/screenshots/redesign-admin-school-day-${theme}.png`, fullPage: true });
    await openSection(page, "school-calendar", "School Calendar");
    await page.waitForTimeout(600);
    await page.screenshot({ path: `e2e/screenshots/redesign-admin-school-calendar-${theme}.png`, fullPage: true });

    await page.goto("/timetable");
    const cls = page.locator("#timetable-class");
    // The one-time guide opens once the page renders; wait for it before closing it (it is late on a busy machine).
    await expect(cls.locator("option", { hasText: "Grade 5A" })).toHaveCount(1);
    await dismissGuide(page, 3_000);
    await cls.selectOption({ label: (await cls.locator("option", { hasText: "Grade 5A" }).textContent())!.trim() });
    await expect(page.locator(".animate-pulse:visible")).toHaveCount(0, { timeout: 30_000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `e2e/screenshots/redesign-admin-timetable-${theme}.png`, fullPage: true });
    await page.getByRole("button", { name: "Add Entry" }).click();
    await page.locator("#entry-period").selectOption({ index: 1 });
    await page.locator("#entry-room").fill(ROOM);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `e2e/screenshots/redesign-admin-period-picker-${theme}.png` });
    await context.close();
  }
});

test.afterAll(async () => {
  // Leave the calendar as the seed made it.
  const admin = await apiLogin(ACCOUNTS.schoolAdmin);
  const events = await apiCall<{ id: string; title: string }[]>(admin, "GET", "/calendar-events");
  for (const e of events.filter((x) => x.title.startsWith("E2E "))) await apiCall(admin, "DELETE", `/calendar-events/${e.id}`);
});
